# Specification

## Summary
**Goal:** Fix manual Bitcoin purchase input validation and ensure balance updates immediately reflect in the UI.

**Planned changes:**
- Fix backend to immediately update user balance when manual Bitcoin purchases are recorded
- Add backend validation to reject invalid transaction IDs (non-64-character hex strings) and invalid BTC amounts (negative, zero, or exceeding 8 decimal places)
- Update frontend forms to display backend validation errors clearly to users

**User-visible outcome:** Users will see their balance update instantly after submitting valid manual Bitcoin purchases, and will receive clear error messages when submitting invalid transaction IDs or BTC amounts.
