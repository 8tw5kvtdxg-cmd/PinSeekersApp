# Readiness implementation — September 18, 2026

Status: implemented and verified locally. Not deployed to production. No customer database was migrated and no real payment, refund, email, prize payout, or simulator attempt was executed in this work.

## Changes

- Challenge Setup holds course/hole/tee/pin/distance, simulator settings, dates, approved active bays, funding/evidence/rehearsal acknowledgments and a supporting reference. Draft is the default. Opening requires the complete record. The authenticated administrator and save time are recorded. Material settings are locked when paid entries in the configured period or unresolved results exist.
- Checkout validates dates, configuration, venue and bay before contacting the processor and before issuing checkout. Square record creation and new entry issuance recheck these constraints transactionally. A stale-link payment cannot create a new entry after closure; the existing reconciliation/refund workflow must review it. Existing paid entries remain on record. A valid QR identifies an approved bay; it does not independently prove physical presence.
- Signup leaves email unverified. Verification tokens are claimed atomically, expire, match the current account email, and preserve a restricted internal challenge destination. Resends are limited by IP and account. Failed delivery leaves the account recoverable. SMS MFA remains paused; admin email MFA remains in place.
- Booking redirects accept a venue slug and resolve the URL from the active database venue. Client-provided destinations/names are ignored. Logging runs after the redirect and catches errors. Obvious bots are excluded and repeated IP/venue clicks are limited to one per minute; this is not a count of unique people. Public telemetry POSTs are disabled.
- Public locations, rental cards, homepage partner cards and administrative listings use managed location records. Venue editors can change active status and HTTPS booking/website URLs. Historical records retain their recorded names. Booking email parsing still has Alamo-specific integration mappings; these do not override managed public listings.
- Analytics separates booking handoffs, historical QR page loads, imported reservations, confirmed completed bookings, identified visitors, repeat visitors, and visits with source evidence. Matching a reservation to a challenge never proves attendance. Admin-recorded outcomes require supporting references and append audit records. Repeated visits require the same email and distinct completed reservation times at that venue. No unsupported acquisition or retention percentage is shown.
- Historical commercial proposals and PDFs are retained under `archive/commercial-terms-2026-09-18/` and retired from current circulation. The current record is `PARTNER_COMMERCIAL_TERMS.md`: compensation is undecided; $3–$4 per customer payment is only a proposal. No payouts were implemented.

## Validation

- 47 automated tests passed, including missing configuration, sales date boundaries, unsafe verification redirects, booking URL policy, and evidence-based repeat visit counts.
- 14 actual local HTTP/database integration checks passed: signup/verification and replay, unverified purchase rejection, admin readiness validation, forged venue/bay handling, approved booking redirects, broken telemetry, disabled venues, expired challenges, outcome authorization/auditing and admin page rendering.
- All 30 migrations applied to a fresh isolated PostgreSQL database.
- Historical-data migration test passed: preserve edited/inactive venue records and consumed-token verification evidence; clear unproven signup timestamps; change Open to Draft while preserving Paused; do not invent bay assignments or rehearsal approval.
- Production Next.js build and TypeScript checks passed. Existing lint warnings and the existing broad file-tracing build warning remain.

Integration scripts: `tools/test-business-readiness.mjs` and `tools/test-readiness-migration.mjs`. They target only an isolated local PostgreSQL instance at port 55439 and a local app at port 3019. Start that app with the isolated database URL and disabled payment/email credentials. They are not production tests. Test data is synthetic. Actual delivery, processor settlement/refunds and physical simulator behavior remain untested.

## Release and remaining work

Before production rollout, take the normal database recovery snapshot and review migration `20260919000000_business_readiness`. Deploy migration and application together during a coordinated window: old code can still auto-verify new signups until replaced. Do not roll back to the old checkout/signup behavior after migration. The migration resets Open challenges to Draft and clears historical email verification timestamps that lack a consumed token for the current email. Customers may need to verify before their next challenge purchase or other verified-account action. Ordinary venue booking remains available for active managed locations.

Run a staging signup/inbox verification and Square sandbox rehearsal using `SUPERVISED_LAUNCH_REHEARSAL.md`. Add the founder-supplied simulator configuration, approved bay, dates, funding/coverage approval, and named onsite operator. Perform and document the supervised rehearsal; do not mark the check complete based on software tests. Resolve operational defects and sign off before opening paid sales. The commercial arrangement also still needs agreement before further partner proposals or payouts.
