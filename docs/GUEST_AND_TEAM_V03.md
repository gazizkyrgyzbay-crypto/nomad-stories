# NOMAD STORIES v0.3-test — Guest & Team Experience

This is **staging software for fictional accounts only**, not a live guest service.

## Guests — no registration

1. Guest selects one of the three demo cabins and arrival/departure dates. The calendar shows vertically scrollable consecutive months, auto-loading additional months.
2. Booking requests only **name + one contact** (phone **or** email) and guest count. No username, password, account creation form, or payment card details.
3. Server validates dates, calculates the test price and writes the reservation to shared PostgreSQL. It automatically creates or reuses a **guest profile** and sets a secure, HttpOnly session cookie; guest opens "Моя поездка" immediately.
4. Future logins: enter contact and verify a one-time code. In staging only **synthetic** email addresses ending `@example.test` or reserved phone pattern `+120255501xx` are accepted; the test code is displayed in the UI. This is deliberately **not secure for real contact identities** and must be replaced with real controlled email/SMS verification before launch.
5. Only guest-owned bookings are returned from the `/api/guest` endpoint when a valid signed session cookie is present. Booking dates and cabin availability are public, but other guest details are not returned publicly.

**No real email, phone, personal guest profile, ID scans, passport information, or payment cards may be entered.** The staging host is currently outside Kazakhstan.

## Staff — a separate portal

Open `/team`. Guests do not see an administrative tab.

- Initial setup: owner opens Railway `STAFF_TEST_CODE` (never copy it to the browser source or Github), provides a **fictional** `@example.test` account and an independent 12+ character password; this bootstrap can only create the first owner.
- Owner creates individual fictional staff accounts, selecting `manager`, `reception` or `housekeeping`; accounts have salted scrypt password hashes and HttpOnly session cookies.
- Manager/reception/owner can manage check-outs. Housekeeping can mark checked-out cabins as cleaned but cannot check guests out or see guest names.
- Staff actions are recorded in a basic audit table. Login attempts are throttled by per-account lockout.
- Pages: Overview, shared 21-day cabin calendar, all bookings, housekeeping and (owner only) staff account management.

## Temporary imagery

The original user's supplied scenic reference images are embedded on the guest website for this *concept demo*. They do **not** purport to be verified cabin exterior/interior photos. Replace with approved actual cabin photos before commercial use.

## Safety and production backlog

- Real confirmation of phone/email ownership **before** showing any account booking history or confirming contact association, abuse controls and deliverability setup.
- Consent, privacy notice, data residency review and confirmed Kazakhstan hosting before collecting live guest information.
- Independent encrypted backups with tested restore procedure.
- Individual staff permissions, credential recovery, invitation lifecycle, MFA for privileged staff, account disablement, audit review and anomaly detection.
- Automated email/SMS, payment-provider sandbox with webhook signatures, notification outbox and detailed reservation lifecycle.
- True cabin photography, pricing, guest capacity, cancellations and local tourism content.
- Versioned migrations rather than runtime `CREATE TABLE` / `ALTER TABLE` calls.
- Automated integration, security and accessibility tests prior to launch.

The trial is designed to migrate to private servers and a Kazakhstan data center using Next.js + PostgreSQL.
