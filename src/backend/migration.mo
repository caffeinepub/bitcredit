import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Blob "mo:core/Blob";
import Text "mo:core/Text";

module {
  type BitcoinAmount = Nat;

  type LegacyAdminConfig = {
    endpoints : [BlockchainApiEndpoint];
    preferredOrder : [Text];
    maxRetries : Nat;
  };

  type LegacyPeerTransferRequest = {
    id : Nat;
    sender : Principal.Principal;
    recipient : Principal.Principal;
    amount : BitcoinAmount;
    status : PeerTransferStatus;
    createdAt : Time.Time;
    lastUpdated : Time.Time;
    approvalTimestamp : ?Time.Time;
    approver : ?Principal.Principal;
    rejectionTimestamp : ?Time.Time;
    rejectionReason : ?Text;
    deleted : Bool;
  };

  type PeerTransferStatus = {
    #pending;
    #approved;
    #rejected;
    #deleted;
  };

  type OperationEntry = {
    provider : Text;
    timestamp : Time.Time;
    apiResponse : Text;
    troubleshootingActions : ?Text;
    resultStatus : TransferStatus;
  };

  type PeerConnectionStatus = {
    connectedPeers : [Text];
    networkHealth : Text;
  };

  type SendBTCRequest = {
    id : Nat;
    owner : Principal.Principal;
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

  type ApiErrorInfo = {
    provider : Text;
    errorType : Text;
    errorDetails : Text;
    timestamp : Time.Time;
  };

  type TransferStatus = {
    #IN_PROGRESS;
    #VERIFIED;
    #COMPLETED;
    #FAILED;
    #PENDING;
    #EVICTED;
  };

  type ConfirmationAnalysisResult = {
    status : TransferStatus;
    feeDecryptorAnalysis : ?MempoolAnalysisResult;
    diagnosticData : ?Text;
    confirmations : ?Nat;
    expectedFee : ?BitcoinAmount;
    suggestedFee : ?BitcoinAmount;
    statusTimestamp : Time.Time;
    forceFreshCheck : ?Bool;
  };

  type MempoolAnalysisResult = {
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

  type FeeRateSufficiency = {
    #SUFFICIENT;
    #BORDERLINE;
    #INSUFFICIENT;
  };

  type ReserveStatus = {
    reserveBtcBalance : BitcoinAmount;
    outstandingIssuedCredits : BitcoinAmount;
    coverageRatio : ?Float;
    coverageDetails : ?CoverageDetails;
    timestamp : Time.Time;
  };

  type CoverageDetails = {
    pendingOutflow : Nat;
    pendingOutflowWithFees : Nat;
    adjustedCoverageRatio : Float;
  };

  type LegacyUserProfile = {
    name : Text;
    bitcoinWallet : ?LegacyBitcoinWallet;
  };

  type LegacyBitcoinWallet = {
    address : Text;
    publicKey : Blob.Blob;
  };

  type WithdrawalRequest = {
    id : Nat;
    owner : Principal.Principal;
    amount : BitcoinAmount;
    method : Text;
    account : ?Text;
    status : WithdrawalStatus;
    timestamp : Time.Time;
    failureReason : ?Text;
  };

  type WithdrawalStatus = {
    #PENDING;
    #PAID;
    #REJECTED;
  };

  type CreditAdjustment = {
    amount : BitcoinAmount;
    reason : Text;
    timestamp : Time.Time;
    adjustmentType : AdjustmentType;
  };

  type AdjustmentType = {
    #puzzleReward : { puzzleId : Text; difficulty : Nat };
    #adminAdjustment : { reason : Text };
  };

  type CreditBalance = {
    balance : BitcoinAmount;
    adjustments : [CreditAdjustment];
  };

  type Transaction = {
    id : Text;
    user : Principal.Principal;
    amount : BitcoinAmount;
    timestamp : Time.Time;
    transactionType : TransactionType;
  };

  type TransactionType = {
    #creditPurchase;
    #debit;
    #adjustment;
    #withdrawalRequested;
    #withdrawalPaid;
    #withdrawalRejected;
  };

  type TransactionBroadcastStatus = {
    #pending;
    #broadcasted : { txid : ?Text; timestamp : Time.Time };
    #confirmed : { confirmations : Nat; timestamp : Time.Time };
    #evicted : { reason : Text; timestamp : Time.Time };
  };

  type BroadcastResponse = {
    success : Bool;
    txid : ?Text;
    error : ?Text;
    diagnosticData : ?Text;
    providerDiagnostic : ?Text;
    provider : ?Text;
  };

  type BlockchainAPIResponse = {
    amount : BitcoinAmount;
    destinationAddress : Text;
    timestamp : Time.Time;
  };

  type ReserveManagementAction = {
    #deposit : BitcoinAmount;
    #withdraw : BitcoinAmount;
    #correction : BitcoinAmount;
  };

  type ReserveChangeReason = {
    #deposit;
    #withdrawal;
    #adjustment;
  };

  type ExtendedReserveAdjustment = {
    amount : BitcoinAmount;
    reason : ReserveChangeReason;
    timestamp : Time.Time;
    performedBy : Principal.Principal;
    transactionId : ?Text;
  };

  type PuzzleReward = {
    puzzleId : Text;
    rewardAmount : BitcoinAmount;
  };

  type ConfirmationCheckResult = {
    isConfirmed : Bool;
    error : ?Text;
    diagnosticData : ?Text;
  };

  type RetryBroadcastResult = {
    success : Bool;
    failureReason : ?Text;
    diagnosticData : ?Text;
  };

  type ReserveMultisigConfig = {
    threshold : Nat;
    pubkeys : [Blob.Blob];
    address : ?Text;
    redeemScript : ?Text;
  };

  type ReserveDepositValidationRequest = {
    txid : Text;
    amount : BitcoinAmount;
  };

  type ReserveDepositValidationResult = {
    success : Bool;
    confirmedDeposit : Bool;
  };

  type ApiProvider = {
    name : Text; // Blockstream, BlockCypher etc.
    baseUrl : Text;
    apiKey : ?Text;
    priority : Nat;
  };

  type BlockchainApiEndpoint = {
    provider : Text; // "Blockstream", "BlockCypher"
    url : Text;
    apiKey : ?Text;
    fee : ?Nat;
    supportsBroadcast : Bool;
  };

  type ApiResponse = {
    status : { #success; #failure };
    blockchainResponse : ?Text;
    apiErrorDetails : ?Text;
    provider : Text;
    timestamp : Time.Time;
    specificError : ?Text;
  };

  type TransactionError = {
    message : Text;
    diagnosticData : ?Text;
  };

  type SendBTCResult = {
    success : Bool;
    requestId : ?Nat;
    recordsUpdated : Bool;
    diagnosticData : ?Text;
  };

  type OldActor = {
    var balances : Map.Map<Principal.Principal, CreditBalance>;
    var transactions : List.List<Transaction>;
    var userProfiles : Map.Map<Principal.Principal, LegacyUserProfile>;
    var transferRequests : Map.Map<Nat, SendBTCRequest>;
    var failedTransfersToRetry : Map.Map<Nat, SendBTCRequest>;
    var withdrawalRequests : Map.Map<Nat, WithdrawalRequest>;
    var adminInitialCreditsIssued : Map.Map<Principal.Principal, Bool>;
    var reserveAdjustments : Map.Map<Nat, ExtendedReserveAdjustment>;
    var peerTransferRequests : Map.Map<Nat, LegacyPeerTransferRequest>;
    var currentBtcPriceUsd : ?Float;
    var lastUpdatedPriceTime : ?Time.Time;
    var reserveBtcBalance : Nat;
    var outstandingIssuedCredits : Nat;
    var transactionFeeRate : Nat;
    var currentNetworkFee : BitcoinAmount;
    var transactionBroadcastMap : Map.Map<Nat, TransactionBroadcastStatus>;
    var requestIdCounter : Nat;
    var reserveAdjustmentCounter : Nat;
    var rtcRequestIdCounter : Nat;
    var btcApiDiagnosticsEnabled : Bool;
    var reserveMultisigConfig : ?ReserveMultisigConfig;
    var blockchainApiConfig : ?LegacyAdminConfig;
  };

  type SegwitMetadata = { p2wpkhStatus : Bool };

  type NewUserProfile = {
    name : Text;
    bitcoinWallet : ?NewBitcoinWallet;
  };

  type NewBitcoinWallet = {
    address : Text;
    publicKey : Blob.Blob;
    segwitMetadata : SegwitMetadata;
  };

  type NewPeerTransferRequest = {
    id : Nat;
    sender : Principal.Principal;
    recipient : Principal.Principal;
    amount : BitcoinAmount;
    status : PeerTransferStatus;
    createdAt : Time.Time;
    lastUpdated : Time.Time;
    approvalTimestamp : ?Time.Time;
    approver : ?Principal.Principal;
    rejectionTimestamp : ?Time.Time;
    rejectionReason : ?Text;
    deleted : Bool;
  };

  type NewAdminConfig = {
    endpoints : [BlockchainApiEndpoint];
    preferredOrder : [Text];
    maxRetries : Nat;
  };

  type NewActor = {
    var balances : Map.Map<Principal.Principal, CreditBalance>;
    var transactions : List.List<Transaction>;
    var userProfiles : Map.Map<Principal.Principal, NewUserProfile>;
    var transferRequests : Map.Map<Nat, SendBTCRequest>;
    var failedTransfersToRetry : Map.Map<Nat, SendBTCRequest>;
    var withdrawalRequests : Map.Map<Nat, WithdrawalRequest>;
    var adminInitialCreditsIssued : Map.Map<Principal.Principal, Bool>;
    var reserveAdjustments : Map.Map<Nat, ExtendedReserveAdjustment>;
    var peerTransferRequests : Map.Map<Nat, NewPeerTransferRequest>;
    var currentBtcPriceUsd : ?Float;
    var lastUpdatedPriceTime : ?Time.Time;
    var reserveBtcBalance : Nat;
    var outstandingIssuedCredits : Nat;
    var transactionFeeRate : Nat;
    var currentNetworkFee : BitcoinAmount;
    var transactionBroadcastMap : Map.Map<Nat, TransactionBroadcastStatus>;
    var requestIdCounter : Nat;
    var reserveAdjustmentCounter : Nat;
    var rtcRequestIdCounter : Nat;
    var btcApiDiagnosticsEnabled : Bool;
    var reserveMultisigConfig : ?ReserveMultisigConfig;
    var blockchainApiConfig : ?NewAdminConfig;
  };

  func migrateBitcoinWallet(oldWallet : LegacyBitcoinWallet) : NewBitcoinWallet {
    {
      oldWallet with
      segwitMetadata = { p2wpkhStatus = false };
    };
  };

  func migrateUserProfile(oldProfile : LegacyUserProfile) : NewUserProfile {
    {
      oldProfile with
      bitcoinWallet = oldProfile.bitcoinWallet.map(migrateBitcoinWallet);
    };
  };

  func migratePeerTransferRequests(oldRequests : Map.Map<Nat, LegacyPeerTransferRequest>) : Map.Map<Nat, NewPeerTransferRequest> {
    oldRequests.map<Nat, LegacyPeerTransferRequest, NewPeerTransferRequest>(
      func(_id, request) {
        request;
      }
    );
  };

  public func run(old : OldActor) : NewActor {
    let newUserProfiles = old.userProfiles.map<Principal.Principal, LegacyUserProfile, NewUserProfile>(
      func(_user, profile) {
        migrateUserProfile(profile);
      }
    );

    {
      var balances = old.balances;
      var transactions = old.transactions;
      var userProfiles = newUserProfiles;
      var transferRequests = old.transferRequests;
      var failedTransfersToRetry = old.failedTransfersToRetry;
      var withdrawalRequests = old.withdrawalRequests;
      var adminInitialCreditsIssued = old.adminInitialCreditsIssued;
      var reserveAdjustments = old.reserveAdjustments;
      var peerTransferRequests = migratePeerTransferRequests(old.peerTransferRequests);
      var currentBtcPriceUsd = old.currentBtcPriceUsd;
      var lastUpdatedPriceTime = old.lastUpdatedPriceTime;
      var reserveBtcBalance = old.reserveBtcBalance;
      var outstandingIssuedCredits = old.outstandingIssuedCredits;
      var transactionFeeRate = old.transactionFeeRate;
      var currentNetworkFee = old.currentNetworkFee;
      var transactionBroadcastMap = old.transactionBroadcastMap;
      var requestIdCounter = old.requestIdCounter;
      var reserveAdjustmentCounter = old.reserveAdjustmentCounter;
      var rtcRequestIdCounter = old.rtcRequestIdCounter;
      var btcApiDiagnosticsEnabled = old.btcApiDiagnosticsEnabled;
      var reserveMultisigConfig = old.reserveMultisigConfig;
      var blockchainApiConfig = old.blockchainApiConfig;
    };
  };
};
