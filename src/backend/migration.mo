import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  type OldSendBTCRequest = {
    id : Nat;
    owner : Principal;
    destinationAddress : Text;
    amount : Nat;
    networkFee : Nat;
    totalCost : Nat;
    status : { #IN_PROGRESS; #VERIFIED; #COMPLETED; #FAILED; #PENDING; #EVICTED };
    timestamp : Int;
    tempStorageForBTCTransaction : ?[Nat8];
    blockchainTxId : ?Text;
    failureReason : ?Text;
    diagnosticData : ?Text;
    confirmedBlockheight : ?Nat;
    evictedDetectedTimestamp : ?Int;
    lastStatusCheckTimestamp : ?Int;
  };

  type NewSendBTCRequest = {
    id : Nat;
    owner : Principal;
    destinationAddress : Text;
    amount : Nat;
    networkFee : Nat;
    totalCost : Nat;
    status : { #IN_PROGRESS; #VERIFIED; #COMPLETED; #FAILED; #PENDING; #EVICTED };
    timestamp : Int;
    tempStorageForBTCTransaction : ?[Nat8];
    blockchainTxId : ?Text;
    failureReason : ?Text;
    diagnosticData : ?Text;
    confirmedBlockheight : ?Nat;
    evictedDetectedTimestamp : ?Int;
    lastStatusCheckTimestamp : ?Int;
    addressValidation : ?{ isValid : Bool; addressType : ?{ #P2PKH; #P2SH; #Bech32; #Bech32m }; error : ?Text };
  };

  type OldActor = {
    transferRequests : Map.Map<Nat, OldSendBTCRequest>;
    failedTransfersToRetry : Map.Map<Nat, OldSendBTCRequest>;
    // Remaining unchanged state variables omitted for brevity.
  };

  type NewActor = {
    transferRequests : Map.Map<Nat, NewSendBTCRequest>;
    failedTransfersToRetry : Map.Map<Nat, NewSendBTCRequest>;
    // Remaining unchanged state variables omitted for brevity.
  };

  func migrateSendBTCRequest(old : OldSendBTCRequest) : NewSendBTCRequest {
    { old with addressValidation = null };
  };

  public func run(old : OldActor) : NewActor {
    let migratedTransferRequests = old.transferRequests.map<Nat, OldSendBTCRequest, NewSendBTCRequest>(
      func(_id, oldRequest) { migrateSendBTCRequest(oldRequest) }
    );
    let migratedFailedTransfers = old.failedTransfersToRetry.map<Nat, OldSendBTCRequest, NewSendBTCRequest>(
      func(_id, oldRequest) { migrateSendBTCRequest(oldRequest) }
    );

    {
      transferRequests = migratedTransferRequests;
      failedTransfersToRetry = migratedFailedTransfers;
    };
  };
};
