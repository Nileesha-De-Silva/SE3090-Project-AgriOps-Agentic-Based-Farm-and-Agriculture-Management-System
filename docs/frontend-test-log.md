# Frontend verification — 26 September 2026

Scope: browser-only React demo. No authentication, backend, Gemini or database calls.

## Automated results

- `npm run build`: PASS before the final hidden-header, skip-link and favicon
  refinements. A requested final build rerun was not approved. Those UI changes
  were checked in the running Vite browser preview; final lint passed.
- `npm run lint`: PASS (no ESLint findings).
- `npm test`: 6/6 passed using Node's test runner.

Tests cover approval creating one purchase without changing stock; duplicate
approval rejection; rejection without a purchase; stale stock protection; changed
supplier price/availability/lead-time protection; exact decimal movements and
invalid quantity/negative stock rejection; minimum-stock boundary; fresh reset data.

## Browser verification

Verified using the running local frontend in the Codex browser:

- Inventory renders six sample resources, three low-stock items and two proposals.
- Recommendation review opens a labelled modal with price, quantity and delivery
  estimate. Approving REC-001 creates one 35 kg request, preserves its decision
  note, reduces the pending count, and does not change stock.
- Receiving two litres of neem oil changes stock from 3 to 5. Attempting to approve
  the older REC-002 snapshot shows a stale-evidence error. Rejection then succeeds
  without creating another purchase.
- Add item creates a zero-stock resource with the entered cost/minimum. Searching
  for its name returns only that resource.
- Responsive layout inspected at desktop (1440px) and mobile (390px); mobile page
  width does not overflow. Navigation and inventory tables scroll within their
  own containers. A hidden header that caused page overflow was corrected.

These checks demonstrate frontend behavior with synthetic records, not a live
manager authorization or API integration. Full accessibility audit and real-device
mobile testing have not been performed. Changes reset on refresh.
