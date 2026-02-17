# Specification

## Summary
**Goal:** Recognize the specified Internet Identity principal as an admin so they can access admin-gated backend methods and the `/admin` route.

**Planned changes:**
- Add the Internet Identity principal `ih4li-2xvzb-eiqhx-p746g-mfu4p-qceq3-iq7li-gh4d2-3ajo4-qldaw-iqe` to the backend admin allowlist used by `AccessControl.isAdmin(...)` / `isCallerAdmin()` in `backend/main.mo`.

**User-visible outcome:** After signing in as `ih4li-2xvzb-eiqhx-p746g-mfu4p-qceq3-iq7li-gh4d2-3ajo4-qldaw-iqe`, the user is treated as an admin: `/admin` loads the Admin page (no access-denied screen) and admin-guarded backend actions no longer fail with unauthorized.
