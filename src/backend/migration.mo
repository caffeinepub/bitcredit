import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  // Old send request type
  type AddressValidationResult = {
    isValid : Bool;
    addressType : ?AddressType;
    error : ?Text;
  };

  type AddressType = {
    #P2PKH;
    #P2SH;
    #Bech32;
    #Bech32m;
  };

  type TransferStatus = {
    #IN_PROGRESS;
    #VERIFIED;
    #COMPLETED;
    #FAILED;
    #PENDING;
    #EVICTED;
  };

  type LegacySendBTCRequest = {
    id : Nat;
    owner : Principal;
    destinationAddress : Text;
    amount : Nat;
    networkFee : Nat;
    totalCost : Nat;
    status : TransferStatus;
    timestamp : Time.Time;
    tempStorageForBTCTransaction : ?[Nat8];
    blockchainTxId : ?Text;
    failureReason : ?Text;
    diagnosticData : ?Text;
    confirmedBlockheight : ?Nat;
    evictedDetectedTimestamp : ?Time.Time;
    lastStatusCheckTimestamp : ?Time.Time;
    addressValidation : ?AddressValidationResult;
  };

  // New send request type without address_validation (from main)
  type SendBTCRequest = {
    id : Nat;
    owner : Principal;
    destinationAddress : Text;
    amount : Nat;
    networkFee : Nat;
    totalCost : Nat;
    status : TransferStatus;
    timestamp : Time.Time;
    tempStorageForBTCTransaction : ?[Nat8];
    blockchainTxId : ?Text;
    failureReason : ?Text;
    diagnosticData : ?Text;
    confirmedBlockheight : ?Nat;
    evictedDetectedTimestamp : ?Time.Time;
    lastStatusCheckTimestamp : ?Time.Time;
  };

  // Old actor state definition
  type OldActor = {
    transferRequests : Map.Map<Nat, LegacySendBTCRequest>;
    failedTransfersToRetry : Map.Map<Nat, LegacySendBTCRequest>;
  };

  // New actor state definition
  type NewActor = {
    transferRequests : Map.Map<Nat, SendBTCRequest>;
    failedTransfersToRetry : Map.Map<Nat, SendBTCRequest>;
  };

  // Converts from legacy type (with addressValidation) to new type (without it)
  func convertLegacySendBTCRequest(
    legacyRequest : LegacySendBTCRequest,
  ) : SendBTCRequest {
    {
      legacyRequest with
      tempStorageForBTCTransaction = legacyRequest.tempStorageForBTCTransaction;
      blockchainTxId = legacyRequest.blockchainTxId;
      failureReason = legacyRequest.failureReason;
      diagnosticData = legacyRequest.diagnosticData;
      confirmedBlockheight = legacyRequest.confirmedBlockheight;
      evictedDetectedTimestamp = legacyRequest.evictedDetectedTimestamp;
      lastStatusCheckTimestamp = legacyRequest.lastStatusCheckTimestamp;
    };
  };

  // Migration entry point
  public func run(old : OldActor) : NewActor {
    let newTransferRequests = old.transferRequests.map<Nat, LegacySendBTCRequest, SendBTCRequest>(
      func(_id, legacyRequest) {
        convertLegacySendBTCRequest(legacyRequest);
      }
    );

    let newFailedTransfers = old.failedTransfersToRetry.map<Nat, LegacySendBTCRequest, SendBTCRequest>(
      func(_id, legacyRequest) {
        convertLegacySendBTCRequest(legacyRequest);
      }
    );

    {
      transferRequests = newTransferRequests;
      failedTransfersToRetry = newFailedTransfers;
    };
  };
};
