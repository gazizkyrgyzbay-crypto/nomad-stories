# Security and release gates

The current interface is **unsafe for real payments and customer data**: no production authentication, shared inventory, secure database or payments.

Before production:
1. Hosting and legal review of Kazakhstan personal data processing, storage, transfers and retention.
2. MFA/passkeys for infrastructure and staff accounts; strict RBAC, audit logs and server-validated authorization.
3. Separate app identities and PostgreSQL credentials for projects, no public DB ports.
4. Production secrets managed outside repository; protected branches, CI tests, dependency/secret scanning.
5. Signed and verified payment webhooks, idempotent status transitions, reconciliation and refunds policy.
6. Transactional inventory holds + exclusion constraint, concurrency tests, expiry handling and maintenance blocks.
7. Encrypted and independent off-site backups, WAL/PITR, restoration test and alerting with assigned owner.
8. Proven operational runbooks for outage, breach, ransomware and lost device.
9. Final approval of property descriptions, guest instructions, media, documents and key handover.
10. ARCHIE remains a personal research project with **no blanket access** to production customer data.

Initial design objectives only: booking RPO <= 15 minutes, RTO <= 4 hours, pending validation by rehearsed recovery.

Never input real guests, card data, ID documents or secrets into the demo.