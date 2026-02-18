# Specification

## Summary
**Goal:** Make the logged-out (unauthenticated) mobile screen show a clear, tappable Internet Identity sign-in button while keeping the logged-out message visible.

**Planned changes:**
- Update the unauthenticated screen to render a prominent primary button alongside the existing “Please log in…” message.
- Label the button exactly “Sign in with Internet Identity”.
- Wire the button to trigger the existing Internet Identity login flow (same behavior as the existing header LoginButton).

**User-visible outcome:** When not signed in (including on mobile), users see a clear “Sign in with Internet Identity” button and can tap it to start the existing Internet Identity login flow, with a visible message explaining they must log in.
