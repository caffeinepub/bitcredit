# Specification

## Summary
**Goal:** Allow the specified Internet Identity principal to be recognized as a backend admin so they can access the `/admin` area.

**Planned changes:**
- Add principal `ih4li-2xvzb-eiqhx-p746g-mfu4p-qceq3-iq7li-gh4d2-3ajo4-qldaw-iqe` to the backend admin allowlist used by `AccessControl.isAdmin(...)`.
- Ensure the frontend admin-gating logic recognizes admin status after login for that principal and permits rendering/navigation to `/admin`.

**User-visible outcome:** After signing in with Internet Identity as `ih4li-2xvzb-eiqhx-p746g-mfu4p-qceq3-iq7li-gh4d2-3ajo4-qldaw-iqe`, the user is treated as an admin and can access the Admin panel at `/admin` without being blocked or redirected.
