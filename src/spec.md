# Specification

## Summary
**Goal:** Implement Bitcoin address generation and transaction signing framework with complete backend infrastructure for P2WPKH addresses, ECDSA signing, and transaction broadcasting.

**Planned changes:**
- Add backend framework for generating Bitcoin P2WPKH (Segwit) addresses with stable storage
- Implement backend ECDSA transaction signing for Segwit transactions with proper witness data
- Add backend HTTP outcall framework for broadcasting signed transactions to multiple public Bitcoin APIs with fallback logic
- Update BitcoinAddressDisplay component to fetch and display generated addresses with QR code and copy functionality
- Update SendBtcPage to integrate with backend signing and broadcasting, displaying transaction status and broadcast logs

**User-visible outcome:** Users can generate Bitcoin receiving addresses displayed with QR codes, and send Bitcoin transactions with full visibility into signing status, broadcast attempts across multiple providers, and final transaction hash on success.
