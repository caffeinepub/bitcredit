import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Blob "mo:core/Blob";

module {
  type BitcoinAmount = Nat;
  type OldActor = {
    balances : Map.Map<Principal, { balance : BitcoinAmount; adjustments : [CreditAdjustment] }>;
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

  public func run(old : OldActor) : OldActor {
    old;
  };
};
