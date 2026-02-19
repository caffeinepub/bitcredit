# Specification

## Summary
**Goal:** Implement Bitcoin transaction sending functionality with helper functions for building transactions and extracting transaction IDs.

**Planned changes:**
- Add sendBitcoin function to backend that accepts destination address and amount, builds a transaction, and broadcasts it to Bitcoin testnet
- Implement buildTransaction helper function to construct raw Bitcoin transactions in hexadecimal format
- Implement getTxId helper function to extract transaction IDs from raw transactions
- Import Bitcoin and Result libraries from mo:base
- Define SendRequest type with destinationAddress and amountSatoshis fields

**User-visible outcome:** The backend will be able to send Bitcoin transactions to testnet addresses, returning transaction IDs upon successful broadcast.
