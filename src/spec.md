# Specification

## Summary
**Goal:** Enhance the transaction history with USD estimates and add an authenticated AI Lottery page that generates Powerball-style outcomes with clear disclosures and resilient data fetching.

**Planned changes:**
- Update the Transaction History table on `/history` to show an estimated USD value beneath each BTC amount using the existing live BTC/USD price hook and the same estimate disclosure/placeholder behavior used in balance cards.
- Add a new authenticated `/ai-lottery` route and navigation link.
- Create an AI Lottery page UI that fetches recent draw data from `https://data.ny.gov` when possible, falls back to local data/logic on failure, and generates 3 Powerball-style outcomes (sorted numbers, Powerball, and AI Confidence) with required English disclaimers.

**User-visible outcome:** On the History page, users see BTC amounts with a clear estimated USD line; signed-in users can open the AI Lottery page from the app navigation to generate and view three entertainment-only Powerball-style outcomes, even if draw-data fetching fails.
