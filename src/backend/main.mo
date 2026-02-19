import List "mo:core/List";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import OutCall "http-outcalls/outcall";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  type BitcoinAmount = Nat;
  public type PeerTransferId = Nat;
  public type WithdrawalRequestId = Nat;
  public type VerificationRequestId = Nat;
  public type TransactionType = {
    #creditPurchase;
    #debit;
    #adjustment;
    #withdrawalRequested;
    #withdrawalPaid;
    #withdrawalRejected;
  };

  var currentBtcPriceUsd : ?Float = null;
  var lastUpdatedPriceTime : ?Time.Time = null;
  var reserveBtcBalance : Nat = 0;
  var outstandingIssuedCredits : Nat = 0;
  let transactionFeeRate : Nat = 50_000;
  let currentNetworkFee = 10 : BitcoinAmount;
  var requestIdCounter : Nat = 0;
  var reserveAdjustmentCounter : Nat = 0;
  var rtcRequestIdCounter : Nat = 100_000_000;
  var btcApiDiagnosticsEnabled = false;
  var reserveMultisigConfig : ?ReserveMultisigConfig = null;
  var blockchainApiConfig : ?AdminConfig = null;
  let balances = Map.empty<Principal, CreditBalance>();
  let transactions = List.empty<Transaction>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let transferRequests = Map.empty<Nat, SendBTCRequest>();
  let failedTransfersToRetry = Map.empty<Nat, SendBTCRequest>();
  let withdrawalRequests = Map.empty<WithdrawalRequestId, WithdrawalRequest>();
  let adminInitialCreditsIssued = Map.empty<Principal, Bool>();
  let reserveAdjustments = Map.empty<Nat, ExtendedReserveAdjustment>();
  let peerTransferRequests = Map.empty<PeerTransferId, PeerTransferRequest>();
  let transactionBroadcastMap = Map.empty<Nat, TransactionBroadcastStatus>();
  let bitcoinPurchases = Map.empty<Text, BitcoinPurchaseRecord>();
  var peerTransferIdCounter : PeerTransferId = 0;
  var withdrawalRequestIdCounter : WithdrawalRequestId = 0;
  let accessControlState = AccessControl.initState();
  let verificationRequests = Map.empty<VerificationRequestId, VerificationRequest>();
  var verificationRequestIdCounter : VerificationRequestId = 0;
  include MixinAuthorization(accessControlState);

  func checkedSub(x : BitcoinAmount, y : BitcoinAmount) : BitcoinAmount {
    if (x < y) {
      Runtime.trap("Not enough balance for this transaction. Please use the frontend as the backend does not validate on outgoing transfers.");
    };
    x - y;
  };

  func getBalance(user : Principal) : BitcoinAmount {
    switch (balances.get(user)) {
      case (?creditBalance) { creditBalance.balance };
      case null { 0 };
    };
  };

  func updateBalance(user : Principal, newBalance : BitcoinAmount) {
    let currentBalance = switch (balances.get(user)) {
      case (?cb) { cb };
      case null {
        {
          balance = 0;
          adjustments = [];
        };
      };
    };
    balances.add(
      user,
      {
        balance = newBalance;
        adjustments = currentBalance.adjustments;
      },
    );
  };

  func addTransaction(user : Principal, amount : BitcoinAmount, txType : TransactionType) {
    let txId = requestIdCounter.toText();
    requestIdCounter += 1;
    let tx : Transaction = {
      id = txId;
      user = user;
      amount = amount;
      timestamp = Time.now();
      transactionType = txType;
    };
    transactions.add(tx);
  };

  public query ({ caller }) func getAllUsers() : async [(Principal, UserProfile)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    userProfiles.toArray();
  };

  public query ({ caller }) func getTransactionHistory() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access transaction history");
    };
    transactions.toArray();
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func sendCreditsToPeer(recipient : Principal, amount : BitcoinAmount) : async PeerTransferId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send credits to peers");
    };

    if (caller == recipient) {
      Runtime.trap("Cannot send credits to yourself");
    };

    let senderBalance = getBalance(caller);
    if (senderBalance < amount) {
      Runtime.trap("Insufficient balance");
    };

    let transferId = peerTransferIdCounter;
    peerTransferIdCounter += 1;

    let now = Time.now();
    let transfer : PeerTransferRequest = {
      id = transferId;
      sender = caller;
      recipient = recipient;
      amount = amount;
      status = #approved;
      createdAt = now;
      lastUpdated = now;
      approvalTimestamp = ?now;
      approver = ?caller;
      rejectionTimestamp = null;
      rejectionReason = null;
      deleted = false;
    };

    peerTransferRequests.add(transferId, transfer);

    let newSenderBalance = checkedSub(senderBalance, amount);
    updateBalance(caller, newSenderBalance);
    addTransaction(caller, amount, #debit);

    let recipientBalance = getBalance(recipient);
    updateBalance(recipient, recipientBalance + amount);
    addTransaction(recipient, amount, #creditPurchase);

    transferId;
  };

  public query ({ caller }) func getPeerTransfer(transferId : PeerTransferId) : async ?PeerTransferRequest {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view peer transfers");
    };
    switch (peerTransferRequests.get(transferId)) {
      case (?transfer) {
        if (transfer.sender == caller or transfer.recipient == caller or AccessControl.isAdmin(accessControlState, caller)) {
          ?transfer;
        } else {
          Runtime.trap("Unauthorized: Can only view your own transfers");
        };
      };
      case null { null };
    };
  };

  public query ({ caller }) func getCallerPeerTransfers() : async [PeerTransferRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view peer transfers");
    };
    let allTransfers = peerTransferRequests.toArray();
    List.fromArray<(PeerTransferId, PeerTransferRequest)>(allTransfers).filter<(PeerTransferId, PeerTransferRequest)>(
      func(entry) {
        let transfer = entry.1;
        transfer.sender == caller or transfer.recipient == caller;
      }
    ).map<(PeerTransferId, PeerTransferRequest), PeerTransferRequest>(
      func(entry) {
        entry.1;
      }
    ).toArray();
  };

  public shared ({ caller }) func requestWithdrawal(amount : BitcoinAmount, method : Text, account : ?Text) : async WithdrawalRequestId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request withdrawals");
    };
    let userBalance = getBalance(caller);
    if (userBalance < amount) {
      Runtime.trap("Insufficient balance for withdrawal");
    };

    let requestId = withdrawalRequestIdCounter;
    withdrawalRequestIdCounter += 1;

    let request : WithdrawalRequest = {
      id = requestId;
      owner = caller;
      amount = amount;
      method = method;
      account = account;
      status = #PENDING;
      timestamp = Time.now();
      failureReason = null;
    };

    withdrawalRequests.add(requestId, request);

    let newBalance = checkedSub(userBalance, amount);
    updateBalance(caller, newBalance);
    addTransaction(caller, amount, #withdrawalRequested);
    requestId;
  };

  public query ({ caller }) func getWithdrawalRequest(requestId : WithdrawalRequestId) : async ?WithdrawalRequest {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view withdrawal requests");
    };
    switch (withdrawalRequests.get(requestId)) {
      case (?request) {
        if (request.owner == caller or AccessControl.isAdmin(accessControlState, caller)) {
          ?request;
        } else {
          Runtime.trap("Unauthorized: Can only view your own withdrawal requests");
        };
      };
      case null { null };
    };
  };

  public query ({ caller }) func getCallerWithdrawalRequests() : async [WithdrawalRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view withdrawal requests");
    };
    let allRequests = withdrawalRequests.toArray();
    List.fromArray<(WithdrawalRequestId, WithdrawalRequest)>(allRequests).filter<(WithdrawalRequestId, WithdrawalRequest)>(
      func(entry) {
        entry.1.owner == caller;
      }
    ).map<(WithdrawalRequestId, WithdrawalRequest), WithdrawalRequest>(
      func(entry) {
        entry.1;
      }
    ).toArray();
  };

  public query ({ caller }) func getAllWithdrawalRequests() : async [WithdrawalRequest] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all withdrawal requests");
    };
    withdrawalRequests.toArray().map<(WithdrawalRequestId, WithdrawalRequest), WithdrawalRequest>(
      func(entry) { entry.1 }
    );
  };

  public shared ({ caller }) func approveWithdrawal(requestId : WithdrawalRequestId) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can approve withdrawals");
    };
    switch (withdrawalRequests.get(requestId)) {
      case (?request) {
        if (request.status != #PENDING) {
          Runtime.trap("Withdrawal request is not in PENDING status");
        };
        let updatedRequest : WithdrawalRequest = {
          id = request.id;
          owner = request.owner;
          amount = request.amount;
          method = request.method;
          account = request.account;
          status = #PAID;
          timestamp = request.timestamp;
          failureReason = null;
        };
        withdrawalRequests.add(requestId, updatedRequest);
        addTransaction(request.owner, request.amount, #withdrawalPaid);
      };
      case null {
        Runtime.trap("Withdrawal request not found");
      };
    };
  };

  public shared ({ caller }) func rejectWithdrawal(requestId : WithdrawalRequestId, reason : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can reject withdrawals");
    };
    switch (withdrawalRequests.get(requestId)) {
      case (?request) {
        if (request.status != #PENDING) {
          Runtime.trap("Withdrawal request is not in PENDING status");
        };
        let updatedRequest : WithdrawalRequest = {
          id = request.id;
          owner = request.owner;
          amount = request.amount;
          method = request.method;
          account = request.account;
          status = #REJECTED;
          timestamp = request.timestamp;
          failureReason = ?reason;
        };
        withdrawalRequests.add(requestId, updatedRequest);
        let userBalance = getBalance(request.owner);
        updateBalance(request.owner, userBalance + request.amount);
        addTransaction(request.owner, request.amount, #withdrawalRejected);
      };
      case null {
        Runtime.trap("Withdrawal request not found");
      };
    };
  };

  public shared ({ caller }) func markWithdrawalAsPaid(requestId : WithdrawalRequestId) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can mark withdrawals as paid");
    };
    switch (withdrawalRequests.get(requestId)) {
      case (?request) {
        if (request.status != #PENDING) {
          Runtime.trap("Withdrawal request is not in PENDING status");
        };
        let updatedRequest : WithdrawalRequest = {
          id = request.id;
          owner = request.owner;
          amount = request.amount;
          method = request.method;
          account = request.account;
          status = #PAID;
          timestamp = request.timestamp;
          failureReason = null;
        };
        withdrawalRequests.add(requestId, updatedRequest);
        addTransaction(request.owner, request.amount, #withdrawalPaid);
      };
      case null {
        Runtime.trap("Withdrawal request not found");
      };
    };
  };

  public query ({ caller }) func getCallerBalance() : async BitcoinAmount {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their balance");
    };
    getBalance(caller);
  };

  public query ({ caller }) func getBitcoinPurchases() : async [(Text, BitcoinPurchaseRecord)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view Bitcoin purchases");
    };
    bitcoinPurchases.toArray();
  };

  public shared ({ caller }) func recordBitcoinPurchase(input : BitcoinPurchaseRecordInput) : async VerificationRequestId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can submit Bitcoin purchase verification requests");
    };

    switch (bitcoinPurchases.get(input.transactionId)) {
      case (?_) {
        Runtime.trap("Bitcoin purchase with this transaction ID already exists");
      };
      case null {
        let existingRequests = verificationRequests.toArray();
        for ((id, req) in existingRequests.vals()) {
          if (req.transactionId == input.transactionId and req.status == #pending) {
            Runtime.trap("Verification request for this transaction ID is already pending");
          };
        };
      };
    };

    let requestId = verificationRequestIdCounter;
    verificationRequestIdCounter += 1;

    let request : VerificationRequest = {
      id = requestId;
      requester = caller;
      transactionId = input.transactionId;
      amount = input.amount;
      status = #pending;
      submittedAt = Time.now();
      reviewedAt = null;
      reviewedBy = null;
      reviewComment = null;
    };

    verificationRequests.add(requestId, request);
    requestId;
  };

  public query ({ caller }) func getVerificationRequest(requestId : VerificationRequestId) : async ?VerificationRequest {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view verification requests");
    };
    switch (verificationRequests.get(requestId)) {
      case (?request) {
        if (request.requester == caller or AccessControl.isAdmin(accessControlState, caller)) {
          ?request;
        } else {
          Runtime.trap("Unauthorized: Can only view your own verification requests");
        };
      };
      case null { null };
    };
  };

  public query ({ caller }) func getCallerVerificationRequests() : async [VerificationRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view verification requests");
    };
    let allRequests = verificationRequests.toArray();
    List.fromArray<(VerificationRequestId, VerificationRequest)>(allRequests).filter<(VerificationRequestId, VerificationRequest)>(
      func(entry) {
        entry.1.requester == caller;
      }
    ).map<(VerificationRequestId, VerificationRequest), VerificationRequest>(
      func(entry) {
        entry.1;
      }
    ).toArray();
  };

  public query ({ caller }) func getAllVerificationRequests() : async [VerificationRequest] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all verification requests");
    };
    verificationRequests.toArray().map<(VerificationRequestId, VerificationRequest), VerificationRequest>(
      func(entry) { entry.1 }
    );
  };

  public shared ({ caller }) func approveVerificationRequest(requestId : VerificationRequestId, comment : ?Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can approve verification requests");
    };
    switch (verificationRequests.get(requestId)) {
      case (?request) {
        if (request.status != #pending) {
          Runtime.trap("Verification request is not in pending status");
        };

        if (bitcoinPurchases.get(request.transactionId) != null) {
          Runtime.trap("Transaction ID already processed, duplicate credit not allowed");
        };

        let updatedRequest : VerificationRequest = {
          id = request.id;
          requester = request.requester;
          transactionId = request.transactionId;
          amount = request.amount;
          status = #approved;
          submittedAt = request.submittedAt;
          reviewedAt = ?Time.now();
          reviewedBy = ?caller;
          reviewComment = comment;
        };
        verificationRequests.add(requestId, updatedRequest);

        let currentBalance = getBalance(request.requester);
        updateBalance(request.requester, currentBalance + request.amount);
        addTransaction(request.requester, request.amount, #creditPurchase);

        let purchaseRecord : BitcoinPurchaseRecord = {
          transactionId = request.transactionId;
          amount = request.amount;
          verifiedAt = Time.now();
          verifiedBy = caller;
        };
        bitcoinPurchases.add(request.transactionId, purchaseRecord);
      };
      case null {
        Runtime.trap("Verification request not found");
      };
    };
  };

  public shared ({ caller }) func rejectVerificationRequest(requestId : VerificationRequestId, reason : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can reject verification requests");
    };
    switch (verificationRequests.get(requestId)) {
      case (?request) {
        if (request.status != #pending) {
          Runtime.trap("Verification request is not in pending status");
        };

        let updatedRequest : VerificationRequest = {
          id = request.id;
          requester = request.requester;
          transactionId = request.transactionId;
          amount = request.amount;
          status = #rejected;
          submittedAt = request.submittedAt;
          reviewedAt = ?Time.now();
          reviewedBy = ?caller;
          reviewComment = ?reason;
        };
        verificationRequests.add(requestId, updatedRequest);
      };
      case null {
        Runtime.trap("Verification request not found");
      };
    };
  };

  public query ({ caller }) func getBitcoinPurchase(transactionId : Text) : async ?BitcoinPurchaseRecord {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view Bitcoin purchases");
    };
    bitcoinPurchases.get(transactionId);
  };

  public shared ({ caller }) func creditBtcWithVerification(targetUser : Principal, transactionId : Text, amount : BitcoinAmount) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can credit user accounts");
    };

    switch (bitcoinPurchases.get(transactionId)) {
      case (null) {
        let currentBalance = switch (balances.get(targetUser)) {
          case (?balance) { balance.balance };
          case (null) { 0 };
        };
        updateBalance(targetUser, currentBalance + amount);
        addTransaction(targetUser, amount, #creditPurchase);

        let purchaseRecord : BitcoinPurchaseRecord = {
          transactionId = transactionId;
          amount = amount;
          verifiedAt = Time.now();
          verifiedBy = caller;
        };
        bitcoinPurchases.add(transactionId, purchaseRecord);
      };
      case (_) {
        Runtime.trap("Transaction ID already processed, duplicate credit not allowed.");
      };
    };
  };

  public type BitcoinPurchaseRecord = {
    transactionId : Text;
    amount : BitcoinAmount;
    verifiedAt : Time.Time;
    verifiedBy : Principal;
  };

  public type BitcoinPurchaseRecordInput = {
    transactionId : Text;
    amount : BitcoinAmount;
  };

  public type VerificationRequest = {
    id : VerificationRequestId;
    requester : Principal;
    transactionId : Text;
    amount : BitcoinAmount;
    status : VerificationStatus;
    submittedAt : Time.Time;
    reviewedAt : ?Time.Time;
    reviewedBy : ?Principal;
    reviewComment : ?Text;
  };

  public type VerificationStatus = {
    #pending;
    #approved;
    #rejected;
    #instantApproved;
  };

  public type SegwitMetadata = { p2wpkhStatus : Bool };
  public type AdminConfig = {
    endpoints : [BlockchainApiEndpoint];
    preferredOrder : [Text];
    maxRetries : Nat;
  };
  public type PeerTransferRequest = {
    id : PeerTransferId;
    sender : Principal;
    recipient : Principal;
    amount : BitcoinAmount;
    status : PeerTransferStatus;
    createdAt : Time.Time;
    lastUpdated : Time.Time;
    approvalTimestamp : ?Time.Time;
    approver : ?Principal;
    rejectionTimestamp : ?Time.Time;
    rejectionReason : ?Text;
    deleted : Bool;
  };
  public type PeerTransferStatus = {
    #pending;
    #approved;
    #rejected;
    #deleted;
  };
  public type OperationEntry = {
    provider : Text;
    timestamp : Time.Time;
    apiResponse : Text;
    troubleshootingActions : ?Text;
    resultStatus : TransferStatus;
  };
  public type PeerConnectionStatus = {
    connectedPeers : [Text];
    networkHealth : Text;
  };
  public type SendBTCRequest = {
    id : Nat;
    owner : Principal;
    destinationAddress : Text;
    amount : BitcoinAmount;
    networkFee : BitcoinAmount;
    totalCost : BitcoinAmount;
    status : TransferStatus;
    timestamp : Time.Time;
    contractAddress : ?Text;
    transactionHash : ?Text;
    txid : ?Text;
    tempStorageForBTCTransaction : ?[Nat8];
    blockchainTxId : ?Text;
    failureReason : ?Text;
    diagnosticData : ?Text;
    diagnosticApiResponse : ?Text;
    confirmedBlockheight : ?Nat;
    evictedDetectedTimestamp : ?Time.Time;
    lastStatusCheckTimestamp : ?Time.Time;
    operations : [OperationEntry];
    successTrail : ?OperationEntry;
    troubleshootingActions : [Text];
    errorBreakdown : [ApiErrorInfo];
  };
  public type ApiErrorInfo = {
    provider : Text;
    errorType : Text;
    errorDetails : Text;
    timestamp : Time.Time;
  };
  public type TransferStatus = {
    #IN_PROGRESS;
    #VERIFIED;
    #COMPLETED;
    #FAILED;
    #PENDING;
    #EVICTED;
  };
  public type ConfirmationAnalysisResult = {
    status : TransferStatus;
    feeDecryptorAnalysis : ?MempoolAnalysisResult;
    diagnosticData : ?Text;
    confirmations : ?Nat;
    expectedFee : ?BitcoinAmount;
    suggestedFee : ?BitcoinAmount;
    statusTimestamp : Time.Time;
    forceFreshCheck : ?Bool;
  };
  public type MempoolAnalysisResult = {
    txid : Text;
    mempoolFeeRate : BitcoinAmount;
    recommendedFeeRate : BitcoinAmount;
    feeRateSufficiency : FeeRateSufficiency;
    timestamp : Time.Time;
    mempoolDepthBytes : ?BitcoinAmount;
    recommendedNextBlockFeeRate : ?BitcoinAmount;
    diagnosticData : ?Text;
    feeDescription : Text;
  };
  public type FeeRateSufficiency = {
    #SUFFICIENT;
    #BORDERLINE;
    #INSUFFICIENT;
  };
  public type ReserveStatus = {
    reserveBtcBalance : BitcoinAmount;
    outstandingIssuedCredits : BitcoinAmount;
    coverageRatio : ?Float;
    coverageDetails : ?CoverageDetails;
    timestamp : Time.Time;
  };
  public type CoverageDetails = {
    pendingOutflow : Nat;
    pendingOutflowWithFees : Nat;
    adjustedCoverageRatio : Float;
  };
  public type UserProfile = {
    name : Text;
    bitcoinWallet : ?BitcoinWallet;
  };
  public type BitcoinWallet = {
    address : Text;
    publicKey : Blob;
    segwitMetadata : SegwitMetadata;
  };
  public type WithdrawalRequest = {
    id : WithdrawalRequestId;
    owner : Principal;
    amount : BitcoinAmount;
    method : Text;
    account : ?Text;
    status : WithdrawalStatus;
    timestamp : Time.Time;
    failureReason : ?Text;
  };
  public type WithdrawalStatus = {
    #PENDING;
    #PAID;
    #REJECTED;
  };
  public type CreditAdjustment = {
    amount : BitcoinAmount;
    reason : Text;
    timestamp : Time.Time;
    adjustmentType : AdjustmentType;
  };
  public type AdjustmentType = {
    #puzzleReward : { puzzleId : Text; difficulty : Nat };
    #adminAdjustment : { reason : Text };
  };
  public type CreditBalance = {
    balance : BitcoinAmount;
    adjustments : [CreditAdjustment];
  };
  public type Transaction = {
    id : Text;
    user : Principal;
    amount : BitcoinAmount;
    timestamp : Time.Time;
    transactionType : TransactionType;
  };
  public type TransactionBroadcastStatus = {
    #pending;
    #broadcasted : { txid : ?Text; timestamp : Time.Time };
    #confirmed : { confirmations : Nat; timestamp : Time.Time };
    #evicted : { reason : Text; timestamp : Time.Time };
  };
  public type BroadcastResponse = {
    success : Bool;
    txid : ?Text;
    error : ?Text;
    diagnosticData : ?Text;
    providerDiagnostic : ?Text;
    provider : ?Text;
  };
  public type BlockchainAPIResponse = {
    amount : BitcoinAmount;
    destinationAddress : Text;
    timestamp : Time.Time;
  };
  public type ReserveManagementAction = {
    #deposit : BitcoinAmount;
    #withdraw : BitcoinAmount;
    #correction : BitcoinAmount;
  };
  public type ReserveChangeReason = {
    #deposit;
    #withdrawal;
    #adjustment;
  };
  public type ExtendedReserveAdjustment = {
    amount : BitcoinAmount;
    reason : ReserveChangeReason;
    timestamp : Time.Time;
    performedBy : Principal;
    transactionId : ?Text;
  };
  public type PuzzleReward = {
    puzzleId : Text;
    rewardAmount : BitcoinAmount;
  };
  public type ConfirmationCheckResult = {
    isConfirmed : Bool;
    error : ?Text;
    diagnosticData : ?Text;
  };
  public type RetryBroadcastResult = {
    success : Bool;
    failureReason : ?Text;
    diagnosticData : ?Text;
  };
  public type ReserveMultisigConfig = {
    threshold : Nat;
    pubkeys : [Blob];
    address : ?Text;
    redeemScript : ?Text;
  };
  public type ReserveDepositValidationRequest = {
    txid : Text;
    amount : BitcoinAmount;
  };
  public type ReserveDepositValidationResult = {
    success : Bool;
    confirmedDeposit : Bool;
  };
  public type ApiProvider = {
    name : Text;
    baseUrl : Text;
    apiKey : ?Text;
    priority : Nat;
  };
  public type BlockchainApiEndpoint = {
    provider : Text;
    url : Text;
    apiKey : ?Text;
    fee : ?Nat;
    supportsBroadcast : Bool;
  };
  public type ApiResponse = {
    status : { #success; #failure };
    blockchainResponse : ?Text;
    apiErrorDetails : ?Text;
    provider : Text;
    timestamp : Time.Time;
    specificError : ?Text;
  };
  public type TransactionError = {
    message : Text;
    diagnosticData : ?Text;
  };
  public type SendBTCResult = {
    success : Bool;
    requestId : ?Nat;
    recordsUpdated : Bool;
    diagnosticData : ?Text;
  };
};
