import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  type BitcoinAddress = {
    address : Text;
    publicKey : Blob;
    segwitMetadata : SegwitMetadata;
    addressType : { #P2WPKH };
    network : { #mainnet; #testnet };
    createdAt : Time.Time;
    creator : Principal;
  };

  type SegwitMetadata = { p2wpkhStatus : Bool };

  type OldActor = {};

  type NewActor = {
    userBitcoinAddresses : Map.Map<Principal, BitcoinAddress>;
  };

  public func run(old : OldActor) : NewActor {
    let addresses = Map.empty<Principal, BitcoinAddress>();
    { userBitcoinAddresses = addresses };
  };
};
