# Specification

## Summary
**Goal:** Add a 1:1 BTC reserve backing model with admin monitoring/management, and clarify user-facing messaging that credits are BTC-denominated and market-priced.

**Planned changes:**
- Add backend reserve-tracking state and a backend query to return reserve BTC balance, total outstanding issued credits (computed from backend state), and a reserve coverage ratio.
- Update backend accounting so reserve balance adjusts automatically on key lifecycle events: increase on verified credit issuance; decrease on successful on-chain BTC broadcast by (receiver amount + network fee); no decrease on broadcast failure when credits are restored; ensure no double-counting across retries/refreshes.
- Enforce 1:1 reserve coverage by blocking new credit issuance when it would cause outstanding credits to exceed tracked reserve, with a clear English error message; add an admin-only backend action to adjust tracked reserve with a required English reason and queryable audit history.
- Update `/admin` to include a Reserve section (admin-only) showing reserve balance, outstanding credits, and coverage ratio, plus a control to submit reserve adjustments with a required reason and refresh the displayed status.
- Update signed-in UI copy to state that 1 credit = 1 BTC, credits are backed 1:1 by BTC held in reserve, and USD value fluctuates with Bitcoin market price; ensure no existing copy contradicts this.

**User-visible outcome:** Admins can view reserve status and adjust tracked reserve (with a reason) from `/admin`, while signed-in users see clear English messaging that credits are BTC-denominated, 1:1 reserve-backed, and USD value fluctuates with BTC price; credit issuance is prevented if it would break 1:1 coverage unless overridden via admin reserve adjustment.
