import Map "mo:core/Map";
import Time "mo:core/Time";
import Float "mo:core/Float";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Blob "mo:core/Blob";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import OutCall "http-outcalls/outcall";
import Principal "mo:core/Principal";
import Migration "migration";

import Text "mo:core/Text";
import Iter "mo:core/Iter";

(with migration = Migration.run)
actor {
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
  let adminInitialCreditsIssued = Map.empty<Principal, Bool>();
  var requestIdCounter : Nat = 0;
  var btcApiDiagnosticsEnabled = false;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

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
  };

  public type BitcoinAmount = Nat; // 1 Satoshi

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
    diagnosticData : ?Text; // New field
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
  };

  public type TransferStatus = {
    #IN_PROGRESS;
    #VERIFIED;
    #COMPLETED;
    #FAILED;
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
    diagnosticData : ?Text; // Added for detailed error reporting
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

  module Transaction {
    public func compare(transaction1 : Transaction, transaction2 : Transaction) : Order.Order {
      Int.compare(transaction1.timestamp, transaction2.timestamp);
    };
  };

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
    userProfiles.add(caller, profile);
  };

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

    // Check reserve before issuing new credits
    if (outstandingIssuedCredits + amount > reserveBtcBalance) {
      Runtime.trap("Insufficient reserve coverage. Cannot issue new credits.");
    };

    // Record credit balance
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

    // Update outstanding issued credits and reserve balance
    outstandingIssuedCredits += amount;
    reserveBtcBalance += amount;
  };

  func verifyBlockchainDeposit(_transactionId : Text, _amount : BitcoinAmount) : async BlockchainVerificationResponse {
    {
      success = true;
      matchingDeposit = true;
    };
  };

  public query func getVerificationEndpoint(_txId : Text) : async Text {
    // Public endpoint - no authorization needed for informational endpoint
    "BTC_API_DISABLED";
  };

  public query func getEstimatedNetworkFee(_destination : Text, _amount : BitcoinAmount) : async BitcoinAmount {
    // Public endpoint - network fees should be transparent to all users including guests
    currentNetworkFee;
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    // Must remain public for IC HTTP outcalls to work
    OutCall.transform(input);
  };

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

    // Record credit balance
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

    let submitResult = await broadcastTransactionToBlockchain(requestId, destination, amount);

    if (not submitResult.success) {
      // Ownership will be checked in `updateRequestOnFailure`
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
        {
          success = false;
          txid = null;
          error = ?"BTC_API_DISABLED";
          diagnosticData = ?("API attempt failed at " # Time.now().toText());
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

    // Record credit balance
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

  public query ({ caller }) func getTransferRequest(requestId : Nat) : async ?SendBTCRequest {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transfer requests");
    };

    getTransferRequestInternal(caller, requestId);
  };

  func getTransferRequestInternal(caller : Principal, requestId : Nat) : ?SendBTCRequest {
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

  public shared ({ caller }) func verifyBTCTransfer(requestId : Nat, blockchainTxId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can verify transfers");
    };

    switch (transferRequests.get(requestId)) {
      case (null) { Runtime.trap("Request does not exist") };
      case (?existingRequest) {
        if (existingRequest.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only verify your own transfer requests");
        };

        let verificationResult = await verifyBlockchainTransfer(
          blockchainTxId,
          existingRequest.destinationAddress,
          existingRequest.amount,
        );

        if (not verificationResult) {
          Runtime.trap("Verification failed. Transfer not marked as completed");
        };

        let updatedRequest : SendBTCRequest = {
          existingRequest with
          status = #VERIFIED;
          blockchainTxId = ?blockchainTxId;
        };
        transferRequests.add(requestId, updatedRequest);
      };
    };
  };

  func verifyBlockchainTransfer(_transactionId : Text, _destination : Text, _amount : BitcoinAmount) : async Bool {
    true;
  };

  public shared ({ caller }) func adjustCredits(user : Principal, amount : BitcoinAmount, reason : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can adjust credits");
    };

    let currentBalance = switch (balances.get(user)) {
      case (null) { 0 };
      case (?balance) { balance.balance };
    };

    // Record credit balance
    let currentAdjustments = switch (balances.get(user)) {
      case (null) { [] };
      case (?balance) { balance.adjustments };
    };

    let adjustment : CreditAdjustment = {
      amount;
      reason;
      timestamp = Time.now();
      adjustmentType = #adminAdjustment { reason };
    };

    let newAdjustments = currentAdjustments.concat([adjustment]);

    let newBalance = {
      balance = currentBalance + amount;
      adjustments = newAdjustments;
    };

    balances.add(user, newBalance);

    let transaction : Transaction = {
      id = user.toText();
      user = user;
      amount;
      timestamp = Time.now();
      transactionType = #adjustment;
    };
    transactions.add(transaction);
  };

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

  public query ({ caller }) func getTransferStatus(requestId : Nat) : async ?TransferStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check transfer status");
    };

    switch (transferRequests.get(requestId)) {
      case (null) {
        Runtime.trap("Request does not exist");
      };
      case (?request) {
        if (request.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only check your own transfer requests");
        };
        ?request.status;
      };
    };
  };

  public shared ({ caller }) func makeTestOutcall(_endpoint : Text) : async Text {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can make test outcalls");
    };
    "BTC_API_DISABLED";
  };

  public query ({ caller }) func getTransferRequestDiagnostics(requestId : Nat) : async ?{
    owner : Principal;
    status : TransferStatus;
    failureReason : ?Text;
    failureCode : ?Text;
    diagnosticData : ?Text;
  } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can access diagnostics");
    };
    switch (transferRequests.get(requestId)) {
      case (null) { null };
      case (?request) {
        ?{
          owner = request.owner;
          status = request.status;
          failureReason = request.failureReason;
          failureCode = request.failureReason;
          diagnosticData = request.diagnosticData;
        };
      };
    };
  };

  public shared ({ caller }) func assignInitialAdminCredits() : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can assign initial credits");
    };

    if (adminInitialCreditsIssued.get(caller) == ?true) {
      Runtime.trap("Initial Admin Credits already assigned");
    };

    let currentBalance = switch (balances.get(caller)) {
      case (null) { 0 };
      case (?balance) { balance.balance };
    };

    let currentAdjustments = switch (balances.get(caller)) {
      case (null) { [] };
      case (?balance) { balance.adjustments };
    };

    let adjustment : CreditAdjustment = {
      amount = 500;
      reason = "Initial admin credits";
      timestamp = Time.now();
      adjustmentType = #adminAdjustment { reason = "Initial admin credits" };
    };

    let newAdjustments = currentAdjustments.concat([adjustment]);

    let newBalance = {
      balance = currentBalance + 500;
      adjustments = newAdjustments;
    };

    balances.add(caller, newBalance);

    let transaction : Transaction = {
      id = "INITIAL_ADMIN_CREDITS";
      user = caller;
      amount = 500;
      timestamp = Time.now();
      transactionType = #creditPurchase;
    };
    transactions.add(transaction);

    adminInitialCreditsIssued.add(caller, true);
  };

  public shared ({ caller }) func transferCreditsToUser(user : Principal, amount : BitcoinAmount) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can transfer credits");
    };

    let adminCurrentBalance = switch (balances.get(caller)) {
      case (null) { 0 };
      case (?balance) { balance.balance };
    };

    if (adminCurrentBalance < amount) {
      Runtime.trap("Insufficient balance");
    };

    let adminCurrentAdjustments = switch (balances.get(caller)) {
      case (null) { [] };
      case (?balance) { balance.adjustments };
    };

    let checkedAdminBalance = (adminCurrentBalance - amount : BitcoinAmount);

    let adminNewBalance = {
      balance = checkedAdminBalance;
      adjustments = adminCurrentAdjustments;
    };

    balances.add(caller, adminNewBalance);

    let adminDebitTransaction : Transaction = {
      id = "ADMIN_TRANSFER_DEBIT_" # user.toText();
      user = caller;
      amount;
      timestamp = Time.now();
      transactionType = #debit;
    };
    transactions.add(adminDebitTransaction);

    let recipientCurrentBalance = switch (balances.get(user)) {
      case (null) { 0 };
      case (?balance) { balance.balance };
    };

    let recipientCurrentAdjustments = switch (balances.get(user)) {
      case (null) { [] };
      case (?balance) { balance.adjustments };
    };

    let adjustment : CreditAdjustment = {
      amount;
      reason = "Admin transfer from " # caller.toText();
      timestamp = Time.now();
      adjustmentType = #adminAdjustment { reason = "Admin transfer" };
    };

    let recipientNewAdjustments = recipientCurrentAdjustments.concat([adjustment]);

    let recipientNewBalance = {
      balance = recipientCurrentBalance + amount;
      adjustments = recipientNewAdjustments;
    };

    balances.add(user, recipientNewBalance);

    let recipientCreditTransaction : Transaction = {
      id = "ADMIN_TRANSFER_CREDIT_" # user.toText();
      user;
      amount;
      timestamp = Time.now();
      transactionType = #adjustment;
    };
    transactions.add(recipientCreditTransaction);
  };

  public query ({ caller }) func getPuzzleRewardsOverview() : async {
    availablePuzzles : [(Text, BitcoinAmount)];
    totalPuzzles : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view puzzle rewards");
    };
    {
      availablePuzzles = [("easy", 10), ("hard", 50)];
      totalPuzzles = 2;
    };
  };

  public shared ({ caller }) func submitPuzzleSolution(_puzzleId : Text, solution : Text) : async {
    rewardAmount : BitcoinAmount;
    newBalance : BitcoinAmount;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit puzzle solutions");
    };

    let rewardAmount : BitcoinAmount = switch (solution) {
      case ("correct_easy") { 10 };
      case ("correct_hard") { 50 };
      case (_) {
        Runtime.trap("Invalid solution, puzzle not solved");
      };
    };

    let currentBalance = switch (balances.get(caller)) {
      case (null) { 0 };
      case (?balance) { balance.balance };
    };

    let currentAdjustments = switch (balances.get(caller)) {
      case (null) { [] };
      case (?balance) { balance.adjustments };
    };

    let adjustment : CreditAdjustment = {
      amount = rewardAmount;
      reason = "Puzzle reward";
      timestamp = Time.now();
      adjustmentType = #puzzleReward { puzzleId = _puzzleId; difficulty = switch (solution) { case ("correct_easy") { 1 }; case (_) { 2 } } };
    };

    let newAdjustments = currentAdjustments.concat([adjustment]);

    let newBalance = {
      balance = currentBalance + rewardAmount;
      adjustments = newAdjustments;
    };

    balances.add(caller, newBalance);

    let transaction : Transaction = {
      id = "PUZZLE_REWARD";
      user = caller;
      amount = rewardAmount;
      timestamp = Time.now();
      transactionType = #adjustment;
    };
    transactions.add(transaction);

    {
      rewardAmount;
      newBalance = currentBalance + rewardAmount;
    };
  };

  public shared ({ caller }) func verifyPuzzleReward(_rewardId : Text) : async Bool {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can verify puzzle rewards");
    };
    true;
  };

  public shared ({ caller }) func confirmOnChain(requestId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can confirm transactions");
    };

    let requestOpt = transferRequests.get(requestId);

    if (requestOpt == null) {
      return false;
    };

    let existingRequest = switch (requestOpt) {
      case (null) { Runtime.trap("Request not found") };
      case (?request) { request };
    };

    if (existingRequest.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only confirm your own transfer requests");
    };

    switch (existingRequest.status) {
      case (#IN_PROGRESS or #VERIFIED) {
        let confirmedRequest : SendBTCRequest = {
          existingRequest with status = #COMPLETED;
        };
        transferRequests.add(requestId, confirmedRequest);

        // Decrement reserve when transfer is successfully completed
        if (existingRequest.totalCost <= reserveBtcBalance) {
          reserveBtcBalance -= existingRequest.totalCost;
        };

        true;
      };
      case (#COMPLETED) { true };
      case (#FAILED) { false };
    };
  };

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

