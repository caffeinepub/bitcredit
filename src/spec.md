# Specification

## Summary
**Goal:** Enable regular users to submit Bitcoin transaction verification requests and allow admins to approve or reject them.

**Planned changes:**
- Add /verify-transaction page where authenticated users can submit transaction details (txid and BTC amount) for manual verification
- Create backend method submitVerificationRequest to store user verification requests with pending status
- Add AdminVerificationRequestsPage at /admin/verification-requests displaying all user-submitted requests with approve/reject actions
- Implement backend methods approveVerificationRequest and rejectVerificationRequest for admins to process submissions
- Add navigation links: "Verify Transaction" for regular users and "Verification Requests" for admins
- Display user's verification history on their verification page showing all submitted requests and their status
- Create React Query hooks for all verification operations following existing patterns

**User-visible outcome:** Regular users can submit Bitcoin transactions for manual verification and track their request status, while admins can review and approve/reject these requests from a dedicated management page.
