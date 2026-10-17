# Online test environment (Railway)

## Status and scope

- GitHub branch: `v0.2-dev` (the separate Pages `main` demo remains unchanged).
- Railway project: `nomad-stories-test`, environment `staging`.
- Web service: `nomad-web`.
- Database: PostgreSQL attached via internal `DATABASE_URL` reference.
- **Synthetic test data only. No real people, payment cards or customer bookings.**

## Current capabilities

- Online booking records stored in a shared PostgreSQL database.
- Server performs date validation and detects conflicting bookings within a transaction with a per-cabin advisory lock.
- Availability queried from shared database, refreshed periodically (not realtime push).
- Staff test console protected by a long, random test code supplied via Railway environment variable.
- Simulated payment does **not** contact a financial institution.
- Guest's own trip list is browser-local for now; globally persisted test bookings appear in the protected staff dashboard.

## Important limitations

- Staff test code is a single shared **temporary test credential**; replace with individual accounts, secure sessions, audit logs and permission roles before any real use.
- No real payment integration, email/SMS delivery, housekeeping accounts, live inventory administration, or production-grade recovery testing yet.
- The in-memory per-instance limit is **not** a distributed anti-abuse defense; use managed rate limiting before wider public testing.
- No customer PII may be entered: Railway resources can be hosted outside Kazakhstan; legal/compliance review and Kazakhstan-resident processing are prerequisites to real guest use.
- Database is provisioned with persistent storage but independent encrypted backups and restore drills have **not** been configured or verified.
- Demo prices and cabin names remain placeholders pending confirmation.
- The public test URL is not a production reservation channel.
- Railway hosting and storage can incur usage charges; monitor plan limits and spending.

## Migration path

1. Keep `src/app/api` routes independent of Railway-specific SDKs.
2. Create versioned SQL migrations, rollback instructions and integrity tests.
3. Export PostgreSQL in a controlled maintenance window using `pg_dump` / `pg_restore` to approved Kazakhstan infrastructure.
4. Transfer approved file assets separately; store bucket endpoint and credentials in deployment variables, never Git.
5. Reconfigure DNS, TLS, secrets, observability, backups and disaster recovery on the destination.
6. Run integration and restoration tests before handling live guests.

## Test checklist

- Select two dates and verify nights + server-calculated amount.
- Reserve one cabin and confirm availability changes on another device.
- Try to reserve overlapping dates: server should reject with HTTP 409.
- Confirm staff dashboard sees the booking when authenticated.
- Mark checked out, then cleaned, and verify updates persist on refresh.
- Refresh a guest page and verify the guest's own trip appears in that browser.
- Disable database temporarily in an isolated test and verify the UI never pretends booking succeeded.
