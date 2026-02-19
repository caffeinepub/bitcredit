# Specification

## Summary
**Goal:** Fix the backend sendBtc function to successfully broadcast Bitcoin transactions to mainnet and improve error handling.

**Planned changes:**
- Diagnose and fix the backend sendBtc function's HTTP outcall issues preventing mainnet transaction broadcasting
- Update blockchain API endpoint configuration to ensure connectivity with public APIs (Blockstream, Mempool.space)
- Improve error handling to distinguish between network issues, API failures, and invalid transactions
- Update frontend SendBtcPage to display specific error messages from the fixed backend

**User-visible outcome:** Users can successfully send Bitcoin transactions to mainnet with clear error feedback if broadcasting fails.
