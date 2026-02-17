# Specification

## Summary
**Goal:** Ensure Send BTC broadcasts transactions to Bitcoin mainnet, stores the resulting txid, and lets users re-check on-chain confirmation to reach a reliable completed state, with correct refund semantics on broadcast failure.

**Planned changes:**
- Update backend `sendBTC(destination, amount)` to attempt Bitcoin mainnet broadcast via existing broadcast path, persist returned `blockchainTxId` on `SendBTCRequest`, and store a non-failed “submitted” status when broadcast succeeds.
- Fix backend failure/rollback behavior so failed/unavailable broadcast marks the request `FAILED`, restores the user’s credits for the full `totalCost`, and records an auditable restoration/refund entry in transaction history with clear English error messaging.
- Add a backend method to re-check a transfer’s on-chain state (using stored `blockchainTxId` or provided txid) and update `SendBTCRequest.status` to `COMPLETED` when confirmation criteria are met, without incorrectly completing on verification failure.
- Update the frontend transfer details experience to provide a user action to confirm/re-check status, refresh and display updated English status text (including a distinct `Completed` state), and show a copyable “On-chain Transaction ID (txid)” when available, while keeping the Send BTC success flow pointing users to History/details for confirmation.

**User-visible outcome:** Users can send BTC with an actual mainnet broadcast attempt, see the on-chain txid when available, re-check confirmation status until it completes, and if a broadcast fails they see a clear failure message and their credits are restored with a visible refund record.
