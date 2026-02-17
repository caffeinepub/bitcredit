module {
  // Old and new actor types are identical here due to persistent state.
  type Actor = {
    currentNetworkFee : Nat;
    requestIdCounter : Nat;
  };

  public func run(old : Actor) : Actor {
    old;
  };
};
