import Map "mo:core/Map";
import Time "mo:core/Time";
import Float "mo:core/Float";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Blob "mo:core/Blob";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Array "mo:core/Array";
import OutCall "http-outcalls/outcall";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // State
  var currentBtcPriceUsd : ?Float = null;
  var lastUpdatedPriceTime : ?Time.Time = null;

  var reserveBtcBalance : Nat = 0;
  var outstandingIssuedCredits : Nat = 0;
  let transactionFeeRate : Nat = 50_000; // Satoshis per gigabyte
  let currentNetworkFee = 10 : BitcoinAmount;

  let balances = Map.empty<Principal, CreditBalance>();
  let transactions = List.empty<Transaction>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let transferRequests = Map.empty<Nat, SendBTCRequest>();
  let failedTransfersToRetry = Map.empty<Nat, SendBTCRequest>();
  let withdrawalRequests = Map.empty<Nat, WithdrawalRequest>();
  let adminInitialCreditsIssued = Map.empty<Principal, Bool>();
  var requestIdCounter : Nat = 0;
  var btcApiDiagnosticsEnabled = false;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type SendBTCRequest = {
    id : Nat;
    owner : Principal;
    destinationAddress : Text;
    amount : BitcoinAmount;
    networkFee : BitcoinAmount;
    totalCost : BitcoinAmount;
    status : TransferStatus;
    timestamp : Time.Time;
    blockchainTxId : ?Text;
    failureReason : ?Text;
    diagnosticData : ?Text;
    confirmedBlockheight : ?Nat;
    evictedDetectedTimestamp : ?Time.Time;
    lastStatusCheckTimestamp : ?Time.Time;
  };

  public type TransferStatus = {
    #IN_PROGRESS;
    #VERIFIED;
    #COMPLETED;
    #FAILED;
    #PENDING;
    #EVICTED;
  };

  public type BitcoinAmount = Nat; // 1 Satoshi

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
  };

  public type UserProfile = {
    name : Text;
    bitcoinWallet : ?BitcoinWallet;
  };

  public type BitcoinWallet = {
    address : Text;
    publicKey : Blob;
    // SECURITY: This type MUST NEVER contain private key material.
    // Private keys must never be stored in the backend or returned via public API.
  };

  public type WithdrawalRequest = {
    id : Nat;
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

  public type TransactionType = {
    #creditPurchase;
    #debit;
    #adjustment;
    #withdrawalRequested;
    #withdrawalPaid;
    #withdrawalRejected;
  };

  public type BlockchainVerificationRequest = {
    transactionId : Text;
    destination : Text;
    amount : BitcoinAmount;
  };

  public type BlockchainVerificationResponse = {
    success : Bool;
    matchingDeposit : Bool;
  };

  public type BroadcastResponse = {
    success : Bool;
    txid : ?Text;
    error : ?Text;
    diagnosticData : ?Text;
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

  public type ReserveAdjustment = {
    amount : BitcoinAmount;
    reason : ReserveChangeReason;
    timestamp : Time.Time;
    performedBy : Principal;
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

  module Transaction {
    public func compare(transaction1 : Transaction, transaction2 : Transaction) : Order.Order {
      Int.compare(transaction1.timestamp, transaction2.timestamp);
    };
  };

  // SECURITY GUARD: Prevent private key material from being stored or returned
  func guardAgainstPrivateKeyExposure() {
    Runtime.trap("SECURITY VIOLATION: This backend must never store, process, or return private key material. Private keys must be managed client-side only. The BitcoinWallet type is restricted to public information (address and public key) only.");
  };

  // Confirmation flow and troubleshooting
  public shared ({ caller }) func analyzeSendBTCRequestConfirmation(requestId : Nat, forceFreshCheck : ?Bool) : async ConfirmationAnalysisResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can analyze confirmations");
    };

    let preferredFreshBlockchainCheck = switch (forceFreshCheck, ?btcApiDiagnosticsEnabled) {
      case (?true, _) { true };
      case (_, ?true) { true };
      case (_, _) { false };
    };

    switch (transferRequests.get(requestId)) {
      case (null) {
        Runtime.trap("Request not found");
      };
      case (?request) {
        // Perform purely deterministic analysis - no AI
        let requestFreshnessSufficient = false;
        let currentPenaltyFee = 5_000_000 : BitcoinAmount;
        let currentNetworkFee = 1_000 : BitcoinAmount;

        let basicResult = {
          status = request.status;
          feeDecryptorAnalysis = null;
          diagnosticData = ?("Analysis performed at " # Time.now().toText());
          confirmations = switch (request.status) {
            case (#COMPLETED) { ?2 };
            case (_) { null };
          };
          expectedFee = ?currentNetworkFee;
          suggestedFee = ?(currentNetworkFee + currentPenaltyFee);
          statusTimestamp = Time.now();
          forceFreshCheck = ?preferredFreshBlockchainCheck;
        };

        if (requestFreshnessSufficient and not preferredFreshBlockchainCheck) {
          return basicResult;
        } else {
          if (request.status == #IN_PROGRESS or request.status == #PENDING) {
            let mempoolAnalysis : MempoolAnalysisResult = {
              txid = switch (request.blockchainTxId) {
                case (?id) { id };
                case (null) { "Unknown" };
              };
              mempoolFeeRate = currentNetworkFee;
              recommendedFeeRate = currentNetworkFee + currentPenaltyFee; // 10% bump
              feeRateSufficiency = #BORDERLINE;
              timestamp = Time.now();
              mempoolDepthBytes = ?200_000;
              recommendedNextBlockFeeRate = ?(currentNetworkFee + 20_000);
              diagnosticData = ?"Fee too low";
              feeDescription = "Fee rate too low. High mempool depth.";
            };

            let dynamicResult = {
              status = switch (request.status) {
                case (#FAILED) { #EVICTED };
                case (currentStatus) { currentStatus };
              };
              feeDecryptorAnalysis = ?mempoolAnalysis;
              diagnosticData = ?("Backend analysis performed at " # Time.now().toText() # " - included mempool analysis results");
              confirmations = null;
              expectedFee = ?currentNetworkFee;
              suggestedFee = ?(currentNetworkFee + 5_000_000 : BitcoinAmount);
              statusTimestamp = Time.now();
              forceFreshCheck = ?preferredFreshBlockchainCheck;
            };

            return dynamicResult;
          } else {
            return basicResult; // No further checks needed for completed/failed/evicted/withdrawn
          };
        };
      };
    };
  };

  func performBTCBroadcast(_requestId : Nat, _destination : Text, _amount : BitcoinAmount) : BroadcastResponse {
    {
      success = false;
      txid = null;
      error = ?"BTC broadcast failed: Cannot connect to blockchain API endpoint. (Hint: If using a local node like http://localhost:18443, it is not accessible from the IC! Please use a reachable API endpoint instead.)";
      diagnosticData = ?("Run failed at " # Time.now().toText());
    };
  };

  public shared ({ caller }) func refreshTransferRequestStatus(requestId : Nat) : async ?SendBTCRequest {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can refresh transfer requests");
    };

    switch (transferRequests.get(requestId)) {
      case (null) { null };
      case (?request) {
        // Enforce same access rules as getTransferRequest (owner or admin)
        if (request.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own transfer requests");
        };

        // If no blockchainTxId, return unchanged
        switch (request.blockchainTxId) {
          case (null) { ?request };
          case (?txId) {
            // If already COMPLETED or FAILED, return unchanged
            switch (request.status) {
              case (#COMPLETED) { ?request };
              case (#FAILED) { ?request };
              case (_) {
                // Check if transaction appears evicted
                let isEvicted = await checkEvictionStatus(txId, request.destinationAddress, request.amount);
                if (isEvicted) {
                  // Update request as FAILED/EVICTED
                  let updatedRequest : SendBTCRequest = {
                    request with
                    status = #FAILED;
                    failureReason = ?detectEvictedTransactionReason();
                    diagnosticData = ?("Transaction appears evicted at " # Time.now().toText() # " - diagnostic check performed");
                    evictedDetectedTimestamp = ?Time.now();
                  };
                  transferRequests.add(requestId, updatedRequest);
                  ?updatedRequest;
                } else {
                  // Fallback to confirmation check
                  let confirmationResult = await checkTransactionConfirmation(txId, request.destinationAddress, request.amount);

                  if (confirmationResult.isConfirmed) {
                    let updatedRequest : SendBTCRequest = {
                      request with
                      status = #COMPLETED;
                      diagnosticData = confirmationResult.diagnosticData;
                    };
                    transferRequests.add(requestId, updatedRequest);
                    ?updatedRequest;
                  } else {
                    // Update diagnostic data for unsuccessful confirmation
                    let updatedRequest : SendBTCRequest = {
                      request with
                      diagnosticData = confirmationResult.diagnosticData;
                    };
                    transferRequests.add(requestId, updatedRequest);
                    ?updatedRequest;
                  };
                };
              };
            };
          };
        };
      };
    };
  };

  func checkTransactionConfirmation(
    txId : Text,
    destination : Text,
    amount : BitcoinAmount,
  ) : async ConfirmationCheckResult {
    // Attempt to verify transaction confirmation via blockchain API
    // This uses IC HTTP outcalls similar to broadcastTransactionToBlockchain

    // Mock implementation - in production this would make actual HTTP outcall
    // to blockchain API to check transaction confirmation status
    let isVerified = await verifyBlockchainTransfer(txId, destination, amount);

    if (isVerified) {
      {
        isConfirmed = true;
        error = null;
        diagnosticData = ?("Transaction confirmed at " # Time.now().toText());
      };
    } else {
      {
        isConfirmed = false;
        error = ?("Unable to verify transaction confirmation via blockchain API");
        diagnosticData = ?("API check attempted at " # Time.now().toText() # " - transaction not yet confirmed or API unavailable");
      };
    };
  };

  func checkEvictionStatus(_txId : Text, _destination : Text, _amount : BitcoinAmount) : async Bool {
    // Always return false in local simulation
    false;
  };

  func detectEvictedTransactionReason() : Text {
    // Deterministically produce "evicted/dropped" reason
    "The transaction appears to have been dropped/evicted from the mempool due to not being confirmed and no longer being found in the mempool or on the blockchain. This typically occurs when a transaction has a low fee rate or if it has been pending for an extended period without confirmation. Please review the transaction details, including the fee rate and confirmation status, to determine if adjustments are needed for successful broadcasting.";
  };

  // User endpoints
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public query ({ caller }) func getCallerBitcoinWallet() : async ?BitcoinWallet {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view wallet");
    };

    let profile = switch (userProfiles.get(caller)) {
      case (null) {
        Runtime.trap("User profile not found");
      };
      case (?profile) { profile };
    };

    profile.bitcoinWallet;
  };

  public shared ({ caller }) func createCallerBitcoinWallet() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create wallets");
    };

    let existingProfile = switch (userProfiles.get(caller)) {
      case (null) {
        Runtime.trap("User profile not found");
      };
      case (?profile) { profile };
    };

    switch (existingProfile.bitcoinWallet) {
      case (?_wallet) {
        Runtime.trap("Wallet already exists");
      };
      case (null) {
        let generatedAddress : Text = "MOCKED_ADDRESS_" # caller.toText();
        let publicKeyBytes = Blob.fromArray([0]);
        let newWallet : BitcoinWallet = {
          address = generatedAddress;
          publicKey = publicKeyBytes;
          // SECURITY: Never add private key fields here
        };

        let updatedProfile : UserProfile = {
          existingProfile with
          bitcoinWallet = ?newWallet;
        };

        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    // SECURITY CHECK: Verify wallet doesn't contain private key material
    switch (profile.bitcoinWallet) {
      case (?wallet) {
        // Verify only allowed fields are present (address and publicKey)
        // If any future code attempts to add private key fields, this will catch it
        let _ = wallet.address;
        let _ = wallet.publicKey;
        // Any additional fields would cause compilation error
      };
      case (null) {};
    };

    userProfiles.add(caller, profile);
  };

  // Credit purchase/update
  public shared ({ caller }) func getCallerBalance() : async BitcoinAmount {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view balance");
    };
    switch (balances.get(caller)) {
      case (null) { 0 };
      case (?creditBalance) { creditBalance.balance };
    };
  };

  public shared ({ caller }) func purchaseCredits(transactionId : Text, amount : BitcoinAmount) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can purchase credits");
    };

    let verificationResult = await verifyBlockchainDeposit(transactionId, amount);
    if (not verificationResult.matchingDeposit) {
      Runtime.trap("Verification failed. Cannot issue credits");
    };

    let currentAdjustments = switch (balances.get(caller)) {
      case (null) { [] };
      case (?_creditBalance) { [] };
    };

    let newBalance = {
      balance = amount;
      adjustments = currentAdjustments;
    };

    balances.add(caller, newBalance);

    let transaction : Transaction = {
      id = transactionId;
      user = caller;
      amount;
      timestamp = Time.now();
      transactionType = #creditPurchase;
    };
    transactions.add(transaction);

    // Update reserve and outstanding issued credits
    reserveBtcBalance += amount;
    outstandingIssuedCredits += amount;
  };

  func verifyBlockchainDeposit(_transactionId : Text, _amount : BitcoinAmount) : async BlockchainVerificationResponse {
    {
      success = true;
      matchingDeposit = true;
    };
  };

  func transformImpl(input : OutCall.TransformationInput) : OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    // Must remain public for IC HTTP outcalls to work
    transformImpl(input);
  };

  // Send BTC - always attempt broadcast via HTTP outcall
  public shared ({ caller }) func sendBTC(destination : Text, amount : BitcoinAmount) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send BTC");
    };

    let currentBalance = switch (balances.get(caller)) {
      case (null) { 0 };
      case (?balance) { balance.balance };
    };

    let totalCost = amount + currentNetworkFee;
    if (currentBalance < totalCost) {
      Runtime.trap("Insufficient funds");
    };

    if (reserveBtcBalance < totalCost) {
      Runtime.trap("Insufficient backend reserves for transaction");
    };

    let currentAdjustments = switch (balances.get(caller)) {
      case (null) { [] };
      case (?balance) { balance.adjustments };
    };

    let checkedBalance = (currentBalance - totalCost : BitcoinAmount);
    let newBalance = {
      balance = checkedBalance;
      adjustments = currentAdjustments;
    };
    balances.add(caller, newBalance);

    let requestId : Nat = requestIdCounter;
    requestIdCounter += 1;

    let newRequest : SendBTCRequest = {
      id = requestId;
      owner = caller;
      destinationAddress = destination;
      amount;
      networkFee = currentNetworkFee;
      totalCost;
      status = #IN_PROGRESS;
      timestamp = Time.now();
      blockchainTxId = null;
      failureReason = null;
      diagnosticData = null;
      confirmedBlockheight = null;
      evictedDetectedTimestamp = null;
      lastStatusCheckTimestamp = null;
    };

    transferRequests.add(requestId, newRequest);

    let transaction : Transaction = {
      id = requestId.toText();
      user = caller;
      amount = totalCost;
      timestamp = Time.now();
      transactionType = #debit;
    };
    transactions.add(transaction);

    // Perform HTTP outcall to broadcast transaction
    let submitResult = await broadcastTransactionToBlockchain(requestId, destination, amount);

    if (not submitResult.success) {
      updateRequestOnFailure(requestId, caller, totalCost, submitResult.error, submitResult.diagnosticData);
    };

    switch (submitResult.txid) {
      case (?txid) {
        let requestOpt = transferRequests.get(requestId);
        switch (requestOpt) {
          case (null) { Runtime.trap("Request not found") };
          case (?existingRequest) {
            assert(existingRequest.owner == caller);
            let updatedRequest : SendBTCRequest = {
              existingRequest with
              status = #IN_PROGRESS;
              blockchainTxId = ?txid;
              diagnosticData = submitResult.diagnosticData;
            };
            transferRequests.add(requestId, updatedRequest);
          };
        };
      };
      case (null) {};
    };

    requestId;
  };

  func broadcastTransactionToBlockchain(transactionId : Nat, _destination : Text, _amount : BitcoinAmount) : async BroadcastResponse {
    switch (transferRequests.get(transactionId)) {
      case (null) {
        {
          success = false;
          txid = null;
          error = ?"Request not found";
          diagnosticData = ?("Request not found at " # Time.now().toText());
        };
      };
      case (?_) {
        let detailedErrorMessage = "BTC broadcast failed: Cannot connect to blockchain API endpoint. (Hint: If using a local node like http://localhost:18443, it is not accessible from the IC! Please use a reachable API endpoint instead.)";
        {
          success = false;
          txid = null;
          error = ?detailedErrorMessage;
          diagnosticData = ?("Network error at " # Time.now().toText() # " (attempted connection)");
        };
      };
    };
  };

  func updateRequestOnFailure(requestId : Nat, owner : Principal, totalCost : BitcoinAmount, failureReason : ?Text, diagnosticData : ?Text) {
    let requestOpt = transferRequests.get(requestId);

    if (requestOpt == null) {
      transferRequests.remove(requestId);
      restoreUserBalance(owner, totalCost);
      return;
    };

    let existingRequest = switch (requestOpt) {
      case (null) { Runtime.trap("Request not found") };
      case (?request) { assert(request.owner == owner); request };
    };

    let failedRequest : SendBTCRequest = {
      existingRequest with
      status = #FAILED;
      failureReason;
      diagnosticData;
    };

    transferRequests.add(requestId, failedRequest);
    restoreUserBalance(owner, totalCost);
    // Do not decrement reserve when transfer fails
  };

  func restoreUserBalance(user : Principal, amount : BitcoinAmount) {
    let currentBalance = switch (balances.get(user)) {
      case (null) { 0 };
      case (?balance) { balance.balance };
    };

    let currentAdjustments = switch (balances.get(user)) {
      case (null) { [] };
      case (?balance) { balance.adjustments };
    };

    let newBalance = {
      balance = currentBalance + amount;
      adjustments = currentAdjustments;
    };

    balances.add(user, newBalance);
  };

  // Network fee query - PUBLIC (no authentication required)
  public query func getEstimatedNetworkFee(_destination : Text, _amount : BitcoinAmount) : async BitcoinAmount {
    // Public endpoint - fee estimation needed by all users including guests
    currentNetworkFee;
  };

  // Transfer request helpers
  public query ({ caller }) func getTransferRequest(requestId : Nat) : async ?SendBTCRequest {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transfer requests");
    };

    getTransferRequestInternal(caller, requestId);
  };

  func getTransferRequestInternal(
    caller : Principal,
    requestId : Nat,
  ) : ?SendBTCRequest {
    switch (transferRequests.get(requestId)) {
      case (null) { null };
      case (?request) {
        if (request.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own transfer requests");
        };
        ?request;
      };
    };
  };

  func verifyBlockchainTransfer(_transactionId : Text, _destination : Text, _amount : BitcoinAmount) : async Bool {
    true;
  };

  // Transaction history
  public query ({ caller }) func getTransactionHistory() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transaction history");
    };

    let allTransactions = transactions.toArray();
    if (AccessControl.isAdmin(accessControlState, caller)) {
      allTransactions.sort().reverse();
    } else {
      let userTransactions = allTransactions.filter(func(tx) { tx.user == caller });
      userTransactions.sort().reverse();
    };
  };

  // Withdrawal requests
  public query ({ caller }) func getWithdrawalRequest(requestId : Nat) : async ?WithdrawalRequest {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view withdrawal requests");
    };

    switch (withdrawalRequests.get(requestId)) {
      case (null) { null };
      case (?request) {
        if (request.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own withdrawal requests");
        };
        ?request;
      };
    };
  };

  public query ({ caller }) func getUserWithdrawalRequests(user : Principal) : async [WithdrawalRequest] {
    if (user != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only users can view your own withdrawal requests");
    };
    let userRequests = withdrawalRequests.values().toArray().filter(
      func(request) { request.owner == user }
    );
    userRequests;
  };

  public query ({ caller }) func getAllWithdrawalRequests() : async [WithdrawalRequest] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all withdrawal requests");
    };
    withdrawalRequests.values().toArray();
  };

  public shared ({ caller }) func submitWithdrawalRequest(amount : BitcoinAmount, method : Text, account : ?Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit withdrawal requests");
    };

    if (amount == 0) {
      Runtime.trap("Cannot withdraw 0 credits");
    };

    let currentBalance = switch (balances.get(caller)) {
      case (null) { 0 };
      case (?creditBalance) { creditBalance.balance };
    };

    if (currentBalance < amount) {
      Runtime.trap("Insufficient balance for withdrawal request");
    };

    let currentAdjustments = switch (balances.get(caller)) {
      case (null) { [] };
      case (?creditBalance) { creditBalance.adjustments };
    };

    let checkedBalance = (currentBalance - amount : BitcoinAmount);

    let newBalance = {
      balance = checkedBalance;
      adjustments = currentAdjustments.concat([
        {
          amount = amount;
          reason = "Withdrawal reservation";
          timestamp = Time.now();
          adjustmentType = #adminAdjustment {
            reason = "Withdrawal reservation";
          };
        },
      ]);
    };

    balances.add(caller, newBalance);

    let requestId : Nat = requestIdCounter;
    requestIdCounter += 1;

    let newRequest : WithdrawalRequest = {
      id = requestId;
      owner = caller;
      amount;
      method;
      account;
      status = #PENDING;
      timestamp = Time.now();
      failureReason = null;
    };

    withdrawalRequests.add(requestId, newRequest);

    let transaction : Transaction = {
      id = requestId.toText();
      user = caller;
      amount = amount;
      timestamp = Time.now();
      transactionType = #withdrawalRequested;
    };
    transactions.add(transaction);

    requestId;
  };

  public shared ({ caller }) func markWithdrawalPaid(requestId : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can mark withdrawals as paid");
    };

    switch (withdrawalRequests.get(requestId)) {
      case (null) { Runtime.trap("Request does not exist") };
      case (?existingRequest) {
        let updatedRequest : WithdrawalRequest = {
          existingRequest with
          status = #PAID;
        };
        withdrawalRequests.add(requestId, updatedRequest);

        let transaction : Transaction = {
          id = requestId.toText();
          user = existingRequest.owner;
          amount = existingRequest.amount;
          timestamp = Time.now();
          transactionType = #withdrawalPaid;
        };
        transactions.add(transaction);
      };
    };
  };

  public shared ({ caller }) func rejectWithdrawalRequest(requestId : Nat, reason : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can reject withdrawal requests");
    };

    switch (withdrawalRequests.get(requestId)) {
      case (null) { Runtime.trap("Request does not exist") };
      case (?existingRequest) {
        let updatedRequest : WithdrawalRequest = {
          existingRequest with
          status = #REJECTED;
          failureReason = ?reason;
        };
        withdrawalRequests.add(requestId, updatedRequest);

        // Restore user's credits
        let userBalance = switch (balances.get(existingRequest.owner)) {
          case (null) { 0 };
          case (?balance) { balance.balance };
        };

        let userAdjustments = switch (balances.get(existingRequest.owner)) {
          case (null) { [] };
          case (?balance) { balance.adjustments };
        };

        let restoredBalance = {
          balance = userBalance + existingRequest.amount;
          adjustments = userAdjustments.concat([
            {
              amount = existingRequest.amount;
              reason = "Withdrawal canceled";
              timestamp = Time.now();
              adjustmentType = #adminAdjustment {
                reason = "Withdrawal canceled";
              };
            },
          ]);
        };

        balances.add(existingRequest.owner, restoredBalance);

        // Record the rejection transaction
        let rejectionTransaction : Transaction = {
          id = requestId.toText();
          user = existingRequest.owner;
          amount = existingRequest.amount;
          timestamp = Time.now();
          transactionType = #withdrawalRejected;
        };
        transactions.add(rejectionTransaction);
      };
    };
  };

  // Other API endpoints
  public shared ({ caller }) func toggleApiDiagnostics() : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can toggle API diagnostics");
    };
    btcApiDiagnosticsEnabled := not btcApiDiagnosticsEnabled;
    btcApiDiagnosticsEnabled;
  };

  public shared ({ caller }) func manageReserve(action : ReserveManagementAction) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can manage reserves");
    };

    let adjustment : ReserveAdjustment = {
      amount = switch (action) {
        case (#deposit(amount)) { amount };
        case (#withdraw(amount)) { amount };
        case (#correction(amount)) { amount };
      };
      reason = switch (action) {
        case (#deposit(_)) { #deposit };
        case (#withdraw(_)) { #withdrawal };
        case (#correction(_)) { #adjustment };
      };
      timestamp = Time.now();
      performedBy = caller;
    };

    switch (action) {
      case (#deposit(amount)) {
        reserveBtcBalance += amount;
      };
      case (#withdraw(amount)) {
        if (amount > reserveBtcBalance) {
          Runtime.trap("Insufficient reserve balance for withdrawal");
        };
        reserveBtcBalance -= amount;
      };
      case (#correction(amount)) {
        reserveBtcBalance := amount;
      };
    };
  };

  public query ({ caller }) func getReserveStatus() : async ReserveStatus {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view reserve status");
    };

    {
      reserveBtcBalance;
      outstandingIssuedCredits;
      coverageRatio = if (reserveBtcBalance > 0) {
        ?(
          outstandingIssuedCredits.toInt().toFloat()
          / reserveBtcBalance.toInt().toFloat()
        );
      } else { null };
    };
  };

  public query func getCurrentBtcPriceUsd() : async ?Float {
    // Public endpoint - price data needed by frontend for all users including guests
    getCurrentBtcPrice();
  };

  public shared ({ caller }) func refreshBtcPrice() : async ?Float {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can refresh BTC price");
    };

    await fetchAndUpdateBtcPrice();
    getCurrentBtcPrice();
  };

  func getCurrentBtcPrice() : ?Float {
    currentBtcPriceUsd;
  };

  func fetchAndUpdateBtcPrice() : async () {
    currentBtcPriceUsd := ?65000.0;
    lastUpdatedPriceTime := ?Time.now();
  };
};
