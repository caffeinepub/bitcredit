# Specification

## Summary
**Goal:** Allow users to send BTC to any valid Bitcoin mainnet address without requiring the recipient to be a registered user.

**Planned changes:**
- Remove backend validation in sendBTC method that checks if destination address belongs to a registered user
- Update error handling to rely only on blockchain API address validation, not app user registry checks
- Preserve existing caller authentication and balance verification

**User-visible outcome:** Users can send BTC to any Bitcoin mainnet address without encountering "user not registered" errors, enabling transfers to external wallets and unregistered recipients.
