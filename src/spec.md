# Specification

## Summary
**Goal:** Fix the profile creation bug where usernames are not being saved when users complete the ProfileSetupModal.

**Planned changes:**
- Debug and fix the username persistence issue in the ProfileSetupModal save flow
- Verify the createProfile mutation is correctly calling the backend
- Add error handling and user feedback to display profile creation errors
- Add loading state indicator during profile creation
- Verify backend validation and storage of username in createProfile method
- Ensure backend returns appropriate success/error responses

**User-visible outcome:** Users can successfully create their profile by entering a username, see loading feedback during save, and receive clear error messages if something goes wrong. The username will persist correctly and users can proceed past the profile setup.
