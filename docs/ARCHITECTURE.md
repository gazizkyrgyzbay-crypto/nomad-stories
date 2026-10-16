# NOMAD STORIES — v0.2-dev architecture

**Status:** public demonstration; not a real booking platform.

### Product modules
- STAY: cabin catalogue, pricing, calendar, booking, real payment gateway later.
- EXPLORE: visual chapters, curated trails, visitor story; do not confuse conceptual map with navigational directions.
- OPERATE: staff calendar, housekeeping, maintenance, cashflow. Must be behind server-side authentication before real use.

### Design decisions
- **Next.js + React + TypeScript** for the mobile-first experience.
- **PostgreSQL** later as the single server-side source of truth; never count on browser localStorage to coordinate real reservations.
- **Modular monolith** before considering microservices.
- **Kazakhstan production hosting** for personal guest data, subject to formal localization/privacy review.
- **PWA** for cached public information on iPhone and Android; payment and availability always online.
- **Private Cloud separation:** production customer data must never be placed in personal ARCHIE or a default home NAS replica.

### Booking contract
- Date-only ISO calendar strings (YYYY-MM-DD); arrival inclusive; checkout exclusive.
- 24–31 Oct = 7 nights; ₸45,000 x 7 = ₸315,000.
- Overlapping inventory prevented **in the production database**, not only by frontend checks.
- Database transactions, expiry-bound holds, idempotent operations and signed payment callbacks required.
- Prices and statuses determined only by server; no payment card processing by app.
- Current v0.2 uses **demo-only localStorage** and is not safe for guest records.

### Current scope
Code in this branch is a development starter with a booking-range UI; source archive available in the conversation also contains a fuller concept implementation. v0.1 remains on main.