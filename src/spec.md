# Specification

## Summary
**Goal:** Fix Bitcoin mainnet broadcast failures for Send/“flash bitcoin” withdrawals so successful sends are actually posted on-chain, recorded with a txid, and failures are handled safely with clear diagnostics and correct accounting.

**Planned changes:**
- Backend: Update `sendBTC(destination, amount)` to attempt a real Bitcoin mainnet broadcast via the existing IC HTTP outcalls path instead of returning `BTC_API_DISABLED`.
- Backend: Persist on-chain results by updating the saved `SendBTCRequest` with `blockchainTxId` on broadcast success and keeping the request in a non-terminal in-progress state.
- Backend: On broadcast failure, keep the transfer request saved, mark it `FAILED`, store an English `failureReason`, and restore the user’s deducted credits (`totalCost`).
- Backend: Adjust reserve BTC accounting so reserve is not decremented on failed broadcasts and is decremented only when the send is actually successful (consistent across refreshes via `getReserveStatus()`).
- Backend: Store admin/dev-safe troubleshooting diagnostics (English failure reason) without exposing secrets, retrievable via existing request-fetching flows.
- Frontend: Update Admin Reserve Management copy to clarify reserve BTC can be funded externally (e.g., BitPay, MoonPay, MetaMask) without implementing provider integrations.
- Frontend: Improve Send BTC/Admin Send BTC UX to display request ID and (when available) the persisted on-chain txid; on failure show a clear message that it was not posted on-chain, include the backend failure reason when present, and indicate credits were restored; add an obvious action to open/view request details (e.g., via History).

**User-visible outcome:** Users and admins can send BTC and see whether it was actually broadcast to Bitcoin mainnet (including txid when available); if a broadcast fails, they see a clear reason, their credits are restored, and they can easily open the saved request details to troubleshoot. Admins also see clearer reserve funding guidance text.
