# Refund and payment-issue operations

This infrastructure is uncommitted and undeployed. The owner reported that counsel accepted the current repository legal package, including its September 1 effective date. The online-claim instructions are a narrowly versioned operational update; retain the final counsel copy and written approval record. The 14-calendar-day flag is a human review aid, never an automatic denial.

## Before deployment

- Apply migration `20260915020000_add_refund_infrastructure` with the other uncommitted compliance migrations.
- Confirm the existing Square token can create refunds (`PAYMENTS_WRITE`) and read payments/refunds (`PAYMENTS_READ`). No new Vercel environment variable is required for this task; existing `SQUARE_ACCESS_TOKEN`, `SQUARE_ENVIRONMENT`, `SQUARE_WEBHOOK_SIGNATURE_KEY`, `RESEND_API_KEY`, `PIN2WIN_EMAIL_FROM`, and `CRON_SECRET` must be correctly configured.
- In the Square Developer Console, subscribe the signed `/api/square/webhook` endpoint to `refund.created` and `refund.updated`. The daily `CRON_SECRET` reconciliation remains a fallback if a webhook is missed.
- Test a payment, partial refund, pending-to-completed refund, duplicate click, timeout/retry, and failed refund in Square Sandbox before enabling production use. Do not issue a production test refund to a real customer without authorization.
- Review customer-facing decision templates and the newly added online-claim sentence against counsel's approved copy. Set an owner for the claim queue and the stated acknowledgment/decision timeframes.
- Preserve prior account-consent hashes and versions. New accounts will accept version `2026.09.15`; existing accepted records are not rewritten. Retain the owner/counsel approval record before deployment.
- Adopt a retention/deletion schedule for refund attachments and a malware-scanning or content-disarm process before treating attachments as fully cleared for administrator opening.

## Customer claim

The signed-in customer opens `/account/payment-issue` or the link on a Square entry page. The form selects a checkout belonging to their account and captures reason, venue, incident date/time, narrative, and an evidence description/reference. It records the Square order/payment identifiers and entry ID from internal records. One PNG, JPEG, or PDF may be attached initially, with up to five files per claim through follow-up uploads. Each file is capped at 3 MB to stay below Vercel's 4.5 MB function request limit. The application checks extension, MIME, signature, and hash; stores bytes privately in Postgres; and serves them only to the owner or MFA administrator as forced downloads. Do not ask for card numbers or identity documents in the text form or attachments.

The 14-day flag uses the later of Square's verified payment-creation time or reported incident, never the older payment-link creation time. If a legacy checkout lacks a trustworthy paid-at timestamp, do not automatically flag it late; inspect the Square payment date during administrator review. A flagged claim is still accepted and shown to administrators. The accepted policy permits late review when the customer could not reasonably discover or report the issue earlier, and legal exceptions remain for counsel/administrators to apply.

## Administrator review and Square refund

Open `/admin/refunds` with an individual MFA-protected admin session. Inspect the payment ID, Square order, result state, code reveal time, entry archive state, narrative, and evidence. Record an internal note and a separate customer-facing explanation when approving or denying. Approval does **not** issue a refund. Enter the amount in dollars and click **Request Square refund** only after verifying the appropriate remedy and amount.

The server independently retrieves the completed USD Square payment for the exact order and amount, checks the unrefunded balance, and requires a verified Square payment ID. It reserves one refund attempt per claim with a stable idempotency key before calling Square. The provider call cannot be atomic with a database transaction; the checkout, entry, claim, and audit event update together only after an authoritative provider response. If the response is uncertain, inspect Square and retry the same request/key from the admin queue. Never create a second manual refund while the first attempt is uncertain.

Refund request/reservation and provider `PENDING` pause event-code access. A completed partial refund records the refunded amount but leaves the entry paid and eligible. A completed full refund marks the entry refunded and blocks code access. Square may report `FAILED` or `REJECTED`; do not represent those as returned funds. Review alternate reimbursement with finance/counsel where needed. Payment status can remain `COMPLETED` in Square after a refund, so use refund-specific fields rather than payment status alone.

Signed refund webhooks trigger a new Square GET lookup, not blind trust in webhook status. The daily reconciliation also refreshes provider-pending attempts and retries queued customer/staff email. Append-only claim events record individual admin identity, decisions, refund requests, and provider transitions. Email delivery markers are separate records.

## Reconciliation and limitations

The existing payment sweep repairs paid checkouts without entries. If recovery fails while the checkout is confirmed successful, it creates one system payment-issue claim and emails the customer and staff. It also opens neutral review claims for paid entries that are archived, lack a code, or are unrevealed during a challenge hold; none of these triggers automatically approves a refund. When a signal clears, its untouched claim is resolved with an event. Staff receive the reconciliation queue and its alert email. Customers receive a separate, retryable notice for persistent confirmation-email failures and entry/payment mismatches, after an hour if still unresolved. Technical-only errors are not sent as unverified customer claims.

Attachments are private and bounded but are not antivirus-scanned or content-disarmed; administrators must scan before opening a downloaded file. A retention schedule is still needed. Externally issued Square/POS refunds are not automatically imported. Successful payments with an entry unusable for other reasons still require human or venue/simulator signals. The provider/database boundary is a recoverable intent-and-reconciliation workflow, not a single atomic transaction. These limitations remain open on the compliance checklist.

Dashboard location/revenue summaries subtract completed in-app refunds from the original entry amount, grouped by the original payment month. They are operational estimates, not a substitute for Square settlement reports or formal accounting. A full in-app refund on an entry with a verified result is blocked pending separate prize/legal review.

Square references: [Refund Payment API](https://developer.squareup.com/reference/square/refunds/refund-payment), [Get Payment Refund API](https://developer.squareup.com/reference/square/refunds-api/get-payment-refund), [Refund webhooks](https://developer.squareup.com/docs/refunds-api/webhooks), [Refund behavior](https://developer.squareup.com/docs/payments-api/refund-payments).

Upload references: [Vercel function payload limit](https://vercel.com/docs/errors/function_payload_too_large), [OWASP file-upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).
