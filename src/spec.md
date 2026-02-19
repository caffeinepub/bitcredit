# Specification

## Summary
**Goal:** Enable flexible Bitcoin address validation, implement AI-assisted broadcast troubleshooting with automatic retry logic, and add on-chain confirmation tracking for transfer requests.

**Planned changes:**
- Accept any valid Bitcoin mainnet address format (P2PKH, P2SH, Bech32, Bech32m) without requiring app registration
- Implement deterministic AI-assisted troubleshooting system that automatically diagnoses and retries failed broadcasts with corrected parameters
- Add automatic blockchain confirmation detection that updates transfer status from IN_PROGRESS to COMPLETED
- Display confirmation indicators in frontend UI when transactions are posted and confirmed on-chain
- Handle specific Bitcoin broadcast error patterns (low fees, duplicates, connectivity issues) with targeted retry strategies
- Show real-time broadcast and troubleshooting status updates in clear English during send flows
- Persist complete troubleshooting attempt history per transfer request for audit trail

**User-visible outcome:** Users can send Bitcoin to any valid mainnet address regardless of app registration. The app automatically troubleshoots and retries failed broadcasts, displays clear progress messages during the process, shows confirmation indicators when transactions are posted and confirmed on-chain, and provides full audit trails of all troubleshooting attempts.
