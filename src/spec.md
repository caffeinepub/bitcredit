# Specification

## Summary
**Goal:** Remove user registration checks blocking admin BTC transfers and ensure admin principal is recognized for all operations.

**Planned changes:**
- Remove backend validation that checks if destination address is a registered user before allowing Send BTC transfers
- Verify admin principal (ih4li-2xvzb-eiqhx-p746g-mfu4p-qceq3-iq7li-gh4d2-3ajo4-qldaw-iqe) is properly recognized by backend admin access control
- Add development logging to sendBTC flow to capture destination address, validation checks, account existence checks, and error messages

**User-visible outcome:** Admin can successfully complete Send BTC transfers to any valid Bitcoin mainnet address without encountering "user not registered" errors.
