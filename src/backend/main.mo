import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Blob "mo:core/Blob";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import OutCall "http-outcalls/outcall";
import AccessControl "authorization/access-control";
import Migration "migration";

import MixinAuthorization "authorization/MixinAuthorization";

(with migration = Migration.run)
actor {
  public type BitcoinAmount = Nat; // 1 Satoshi

  let balances = Map.empty<Principal, CreditBalance>();
  let transactions = List.empty<Transaction>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let transferRequests = Map.empty<Nat, SendBTCRequest>();
  let failedTransfersToRetry = Map.empty<Nat, SendBTCRequest>();
  let withdrawalRequests = Map.empty<Nat, WithdrawalRequest>();
  let adminInitialCreditsIssued = Map.empty<Principal, Bool>();
  let reserveAdjustments = Map.empty<Nat, ExtendedReserveAdjustment>();
  let peerTransferRequests = Map.empty<Nat, PeerTransferRequest>();

  var currentBtcPriceUsd : ?Float = null;
  var lastUpdatedPriceTime : ?Time.Time = null;
  var reserveBtcBalance : Nat = 0;
  var outstandingIssuedCredits : Nat = 0;
  let transactionFeeRate : Nat = 50_000;
  let currentNetworkFee = 10 : BitcoinAmount;

  let transactionBroadcastMap = Map.empty<Nat, TransactionBroadcastStatus>();

  var requestIdCounter : Nat = 0;
  var reserveAdjustmentCounter : Nat = 0;
  var rtcRequestIdCounter : Nat = 100_000_000;
  var btcApiDiagnosticsEnabled = false;
  var reserveMultisigConfig : ?ReserveMultisigConfig = null;
  var blockchainApiConfig : ?AdminConfig = null;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type SegwitMetadata = { p2wpkhStatus : Bool };
  public type AdminConfig = {
    endpoints : [BlockchainApiEndpoint];
    preferredOrder : [Text];
    maxRetries : Nat;
  };

  public type PeerTransferRequest = {
    id : Nat;
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
    name : Text; // Blockstream, BlockCypher etc.
    baseUrl : Text;
    apiKey : ?Text;
    priority : Nat;
  };

  public type BlockchainApiEndpoint = {
    provider : Text; // "Blockstream", "BlockCypher"
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

  func checkedSub(x : BitcoinAmount, y : BitcoinAmount) : BitcoinAmount {
    if (x < y) {
      Runtime.trap("Not enough balance for this transaction. Please use the frontend as the backend does not validate on outgoing transfers.");
    };
    x - y;
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
};
