import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  public type OldActor = {
    userBitcoinAddresses : Map.Map<Principal, BitcoinAddress>;
  };

  public type NewActor = {
    userAddressRecords : Map.Map<Principal, UserAddressRecord>;
  };

  public type BitcoinAddress = {
    address : Text;
    publicKey : Blob;
    segwitMetadata : SegwitMetadata;
    addressType : { #P2WPKH };
    network : { #mainnet; #testnet };
    createdAt : Time.Time;
    creator : Principal;
  };

  public type SegwitMetadata = { p2wpkhStatus : Bool };

  public type UserAddressRecord = {
    addresses : [BitcoinAddress];
    primaryAddress : ?BitcoinAddress;
    lastRotated : ?Time.Time;
    network : { #mainnet; #testnet };
  };

  public func run(old : OldActor) : NewActor {
    let newUserAddressRecords = old.userBitcoinAddresses.map<Principal, BitcoinAddress, UserAddressRecord>(
      func(_principal, address) {
        {
          addresses = [address];
          primaryAddress = ?address;
          lastRotated = null;
          network = address.network;
        };
      }
    );
    { userAddressRecords = newUserAddressRecords };
  };
};
