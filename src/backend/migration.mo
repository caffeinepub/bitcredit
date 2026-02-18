import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  public type ReserveStatus = {
    reserveBtcBalance : Nat;
    outstandingIssuedCredits : Nat;
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

  public type CreditBalance = {
    balance : Nat;
    adjustments : [CreditAdjustment];
  };

  public type CreditAdjustment = {
    amount : Nat;
    reason : Text;
    timestamp : Time.Time;
    adjustmentType : AdjustmentType;
  };

  public type AdjustmentType = {
    #puzzleReward : { puzzleId : Text; difficulty : Nat };
    #adminAdjustment : { reason : Text };
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

  // Old transfer request type.
  public type OldSendBTCRequest = {
    id : Nat;
    owner : Principal;
    destinationAddress : Text;
    amount : Nat;
    networkFee : Nat;
    totalCost : Nat;
    status : TransferStatus;
    timestamp : Time.Time;
    blockchainTxId : ?Text;
    failureReason : ?Text;
  };

  // New transfer request type.
  public type NewSendBTCRequest = {
    id : Nat;
    owner : Principal;
    destinationAddress : Text;
    amount : Nat;
    networkFee : Nat;
    totalCost : Nat;
    status : TransferStatus;
    timestamp : Time.Time;
    blockchainTxId : ?Text;
    failureReason : ?Text;
    diagnosticData : ?Text;
  };

  public type OldActor = {
    currentBtcPriceUsd : ?Float;
    lastUpdatedPriceTime : ?Time.Time;
    reserveBtcBalance : Nat;
    outstandingIssuedCredits : Nat;
    transactionFeeRate : Nat;
    balances : Map.Map<Principal, CreditBalance>;
    transactions : List.List<Transaction>;
    userProfiles : Map.Map<Principal, UserProfile>;
    transferRequests : Map.Map<Nat, OldSendBTCRequest>;
    adminInitialCreditsIssued : Map.Map<Principal, Bool>;
    requestIdCounter : Nat;
    btcApiDiagnosticsEnabled : Bool;
  };

  public type NewActor = {
    currentBtcPriceUsd : ?Float;
    lastUpdatedPriceTime : ?Time.Time;
    reserveBtcBalance : Nat;
    outstandingIssuedCredits : Nat;
    transactionFeeRate : Nat;
    balances : Map.Map<Principal, CreditBalance>;
    transactions : List.List<Transaction>;
    userProfiles : Map.Map<Principal, UserProfile>;
    transferRequests : Map.Map<Nat, NewSendBTCRequest>;
    adminInitialCreditsIssued : Map.Map<Principal, Bool>;
    requestIdCounter : Nat;
    btcApiDiagnosticsEnabled : Bool;
  };

  // Migration function called by the main actor via the with-clause
  public func run(old : OldActor) : NewActor {
    let newTransferRequests = old.transferRequests.map<Nat, OldSendBTCRequest, NewSendBTCRequest>(
      func(_id, oldRequest) {
        { oldRequest with diagnosticData = null };
      }
    );
    { old with transferRequests = newTransferRequests };
  };
};
