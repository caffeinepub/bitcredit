# Specification

## Summary
**Goal:** Add deterministic backend reserve accounting so issued credits remain 1:1 backed by tracked BTC reserve, and enforce reserve-aware send/broadcast behavior with a clear reserve-status API for admin UI consumption.

**Planned changes:**
- Implement deterministic reserve-matching state handling using existing tracked fields for `reserveBtcBalance` and `outstandingIssuedCredits`, and compute a coverage ratio as a single source of truth.
- Fix credit-issuance accounting so the first verified purchase can mint credits even when the tracked reserve starts at 0, while ensuring reserve and outstanding credits remain aligned after the purchase completes.
- Enforce reserve-aware send/broadcast logic: validate sufficient reserve for total on-chain cost (amount + fee) before creating/broadcasting, decrement reserve exactly once on successful broadcast, and avoid decrementing reserve on failed broadcasts where credits are restored.
- Expose (or ensure exposure of) a read-only backend API method returning `ReserveStatus` including `reserveBtcBalance`, `outstandingIssuedCredits`, and `coverageRatio`, with clear English naming and documentation comments.

**User-visible outcome:** Admin-facing consumers can query a clear reserve status (including coverage), credit purchases succeed correctly even from an initial zero tracked reserve state, and send/broadcast attempts fail safely when reserve coverage is insufficient while keeping reserve and credit accounting consistent.
