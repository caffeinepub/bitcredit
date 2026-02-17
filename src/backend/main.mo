import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import List "mo:core/List";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let currentNetworkFee = 10;
  let balances = Map.empty<Principal, CreditBalance>();
  let transactions = List.empty<Transaction>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let transferRequests = Map.empty<Nat, SendBTCRequest>();
  let adminInitialCreditsIssued = Map.empty<Principal, Bool>();
  var requestIdCounter = 0;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  public type SendBTCRequest = {
    id : Nat;
    owner : Principal;
    destinationAddress : Text;
    amount : Nat;
    networkFee : Nat;
    totalCost : Nat;
    status : TransferStatus;
    timestamp : Time.Time;
    blockchainTxId : ?Text;
  };

  public type CreditAdjustment = {
    amount : Nat;
    reason : Text;
    timestamp : Time.Time;
  };

  public type CreditBalance = {
    balance : Nat;
    adjustments : [CreditAdjustment];
  };

  public type Transaction = {
    id : Text;
    user : Principal;
    amount : Nat;
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
    amount : Nat;
  };

  public type BlockchainVerificationResponse = {
    success : Bool;
    matchingDeposit : Bool;
  };

  public type BlockchainAPIResponse = {
    amount : Nat;
    destinationAddress : Text;
    timestamp : Time.Time;
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

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerBalance() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view balance");
    };
    switch (balances.get(caller)) {
      case (null) { 0 };
      case (?creditBalance) { creditBalance.balance };
    };
  };

  public shared ({ caller }) func purchaseCredits(transactionId : Text, amount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can purchase credits");
    };

    let verificationResult = await verifyBlockchainDeposit(transactionId, amount);
    if (not verificationResult.matchingDeposit) {
      Runtime.trap("Verification failed. Cannot issue credits");
    };

    let currentBalance = switch (balances.get(caller)) {
      case (null) { 0 };
      case (?balance) { balance.balance };
    };

    let currentAdjustments = switch (balances.get(caller)) {
      case (null) { [] };
      case (?balance) { balance.adjustments };
    };

    let newBalance = {
      balance = currentBalance + amount;
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
  };

  func verifyBlockchainDeposit(_transactionId : Text, _amount : Nat) : async BlockchainVerificationResponse {
    {
      success = true;
      matchingDeposit = true;
    };
  };

  public query ({ caller }) func getVerificationEndpoint(_txId : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access verification endpoint");
    };
    "BTC_API_DISABLED";
  };

  public query ({ caller }) func getEstimatedNetworkFee(_destination : Text, _amount : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can retrieve network fee");
    };
    currentNetworkFee;
  };

  public shared ({ caller }) func sendBTC(destination : Text, amount : Nat) : async Nat {
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

    let currentAdjustments = switch (balances.get(caller)) {
      case (null) { [] };
      case (?balance) { balance.adjustments };
    };

    let newBalance = {
      balance = currentBalance - totalCost;
      adjustments = currentAdjustments;
    };

    balances.add(caller, newBalance);

    let requestId = requestIdCounter;
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

    requestId;
  };

  public query ({ caller }) func getTransferRequest(requestId : Nat) : async ?SendBTCRequest {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transfer requests");
    };

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

  func verifyBlockchainTransfer(_transactionId : Text, _destination : Text, _amount : Nat) : async Bool {
    true;
  };

  public shared ({ caller }) func adjustCredits(user : Principal, amount : Nat, reason : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can adjust credits");
    };

    let currentBalance = switch (balances.get(user)) {
      case (null) { 0 };
      case (?balance) { balance.balance };
    };

    let currentAdjustments = switch (balances.get(user)) {
      case (null) { [] };
      case (?balance) { balance.adjustments };
    };

    let adjustment : CreditAdjustment = {
      amount;
      reason;
      timestamp = Time.now();
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

  public shared ({ caller }) func makeTestOutcall(endpoint : Text) : async Text {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can make test outcalls");
    };
    "BTC_API_DISABLED";
  };

  public query func transform(_input : Text) : async Text {
    Runtime.trap("Cannot make outcalls on IC. This function is position to prevent page errors");
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

  public shared ({ caller }) func transferCreditsToUser(user : Principal, amount : Nat) : async () {
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

    let adminNewBalance = {
      balance = adminCurrentBalance - amount;
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
};
