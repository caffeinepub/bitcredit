import Time "mo:core/Time";
import Float "mo:core/Float";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Blob "mo:core/Blob";

module {
  type Actor = {
    currentBtcPriceUsd : ?Float;
    lastUpdatedPriceTime : ?Time.Time;
    reserveBtcBalance : Nat;
    outstandingIssuedCredits : Nat;
    transactionFeeRate : Nat;
    currentNetworkFee : Nat;
    requestIdCounter : Nat;
    reserveAdjustmentCounter : Nat;
    rtcRequestIdCounter : Nat;
    btcApiDiagnosticsEnabled : Bool;
    reserveMultisigConfig : ?{
      threshold : Nat;
      pubkeys : [Blob];
      address : ?Text;
      redeemScript : ?Text;
    };
    blockchainApiConfig : ?{
      endpoints : [{
        provider : Text;
        url : Text;
        apiKey : ?Text;
        fee : ?Nat;
        supportsBroadcast : Bool;
      }];
      preferredOrder : [Text];
      maxRetries : Nat;
    };
  };

  public func run(old : Actor) : Actor {
    old;
  };
};
