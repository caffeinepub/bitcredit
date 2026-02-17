# Specification

## Summary
**Goal:** Add an admin-only page that allows the signed-in admin principal to distribute credits.

**Planned changes:**
- Add an admin-only frontend page/view for credit distribution (accessible only when the signed-in principal is the configured admin).
- Add backend Motoko methods to support admin credit distribution and any required state updates, keeping a single actor in `backend/main.mo`.
- Update frontend routing/navigation as needed without modifying immutable UI/component and hook paths.

**User-visible outcome:** When signed in as the admin, the user can open an admin page and distribute credits; non-admin users cannot access or use this page.
