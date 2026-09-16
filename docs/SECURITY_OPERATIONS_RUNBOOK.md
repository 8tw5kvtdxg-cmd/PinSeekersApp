# Pin2Win Security Operations Runbook

Last updated: September 14, 2026

This runbook documents the minimum operational controls surrounding the security features in the application. Completing the code changes does not complete the operational work; each production task below needs an owner and dated evidence.

## Production access

- Every administrator must use an individual Pin2Win user account with a unique password.
- Add authorized email addresses to `PIN2WIN_ADMIN_EMAILS`. Do not restore or distribute a shared administrator password.
- Before deployment, confirm that at least one authorized email has an existing player account and can reset its password through the normal recovery flow.
- Administrator sessions are stored in PostgreSQL, expire after one hour of inactivity, and have an eight-hour absolute limit.
- Administrator login requires a six-digit email verification code after the account password. Codes expire after ten minutes, are single-use, and lock after repeated failures.

## Required secrets

- Generate independent high-entropy values for `PIN2WIN_ADMIN_SESSION_SECRET`, `PIN2WIN_ADMIN_MFA_SECRET`, and `PIN2WIN_RATE_LIMIT_SECRET`.
- Store production secrets only in the hosting provider's encrypted secret manager.
- Never place live secret values in Git, support tickets, screenshots, chat, or this document.
- Restrict permission to view or change production secrets to designated owners.

## Deployment checklist

1. Confirm a current database backup exists.
2. Confirm an individual administrator account is included in `PIN2WIN_ADMIN_EMAILS`.
3. Deploy database migrations before serving the new application version.
4. Verify password login, emailed MFA code delivery, single use, expiration, logout, one-hour idle expiration, and access revocation.
5. Verify authentication and checkout rate limits return HTTP 429 after the configured threshold.
6. Verify cross-site mutation requests return HTTP 403.
7. Verify CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and frame protections on production responses.
8. Verify archiving an entry removes it from active views without deleting its database record.

## Backup and restore

- Enable automated encrypted PostgreSQL backups with the database provider.
- Use a retention period approved by the business owner and counsel; do not guess a deletion period for payment, dispute, winner, or tax records.
- Perform a restore drill into an isolated non-production database at least quarterly.
- Record the backup identifier, restore date, operator, elapsed recovery time, row-count checks, and any errors.
- Restrict backup access to the same or a smaller group than production database access.
- Never restore production data onto an unmanaged developer device.

## Secret rotation

Rotate a secret immediately after suspected disclosure, administrator departure, accidental logging, or unauthorized access. Otherwise, review secrets quarterly.

1. Identify every system using the secret.
2. Create a replacement in the hosting secret manager.
3. Deploy the replacement and verify the dependent integration.
4. Revoke the prior value.
5. For session secrets or suspected account compromise, revoke affected database sessions and require fresh login.
6. Record the owner, date, affected systems, and verification evidence.

## Incident response

1. Contain: disable compromised accounts or integrations, revoke sessions and secrets, and preserve logs.
2. Assess: identify affected systems, data types, users, dates, and unauthorized actions.
3. Preserve evidence: export relevant application, database, hosting, email, payment, and administrator logs without altering originals.
4. Escalate: notify the designated owner, counsel, insurer, payment provider, and technical responders as appropriate.
5. Notify: follow counsel-approved consumer, regulator, partner, and law-enforcement notification requirements and deadlines.
6. Recover: restore clean service, verify payment and entry integrity, and monitor for recurrence.
7. Review: document root cause, timeline, corrective actions, owners, and completion dates.

## Access review

- Review the administrator allowlist and production-provider access monthly.
- Remove access immediately when it is no longer required.
- Review active administrator sessions after role changes or suspected compromise.
- Keep evidence of each review, including reviewer, date, accounts examined, and actions taken.

## Open security work

- Replace email MFA with authenticator-app or passkey MFA if counsel, insurance, or the risk assessment requires a phishing-resistant factor.
- Role-based authorization for operations, verification, finance, and super-administrator duties.
- Centralized security-event alerting and administrator audit views.
- Provider-level backup configuration and a completed restore drill.
