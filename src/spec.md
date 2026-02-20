# Specification

## Summary
**Goal:** Implement backend framework and frontend integration for self-custody wallet features, enabling users to generate wallets, transfer credits, and view transaction history.

**Planned changes:**
- Add backend methods to generate self-custody Bitcoin wallet addresses using derived keys
- Implement backend queries to fetch user's self-custody wallets with balances
- Create backend method to transfer platform balance to self-custody wallets with validation
- Add backend query for self-custody transfer history with status tracking
- Implement state migration logic to add stable storage for wallets and transfers
- Enable GenerateSelfCustodyWalletButton to call backend and display generated address
- Replace SelfCustodyWalletList placeholder with functional component showing all wallets
- Enable TransferToSelfCustodyForm with wallet selection and balance validation
- Replace SelfCustodyTransferHistoryTable placeholder with functional table
- Create React Query hooks for all self-custody operations with cache invalidation

**User-visible outcome:** Users can generate self-custody Bitcoin wallet addresses, transfer their platform balance to these wallets, view all their self-custody wallets with balances, and track transfer history with pending/confirmed/failed statuses.
