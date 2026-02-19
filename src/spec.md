# Specification

## Summary
**Goal:** Remove all Bitcoin address format validation from the application and rely on the blockchain API to determine address validity.

**Planned changes:**
- Remove Bitcoin address format validation from the frontend Send BTC form
- Remove Bitcoin address format validation from the backend sendBTC flow
- Remove Bitcoin address format validation from the Admin Send BTC to Mainnet Wallet form
- Update frontend error handling to display clear messages when the blockchain API rejects an invalid address

**User-visible outcome:** Users and admins can submit any text string as a destination Bitcoin address without pre-validation errors. The blockchain API will determine if the address is valid, and users will see clear error messages if the blockchain API rejects the address.
