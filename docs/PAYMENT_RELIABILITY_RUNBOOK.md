# Payment Reliability Operations

The live Square webhook and customer completion endpoint remain the immediate confirmation paths. The daily reconciliation job is a fallback: it checks up to 20 Square checkouts and 20 Square entries each run, oldest never-checked first. It independently verifies the Square order/payment and amount before repairing a missing entry. It never deletes an entry or grants new access when Square says unpaid.

## Deployment setup

1. Apply the pending Prisma migrations through the normal deployment pipeline before invoking the job.
2. Set an independent random `CRON_SECRET` of at least 16 characters in the Vercel production environment. Vercel sends it as a Bearer authorization header to `/api/cron/payment-reconciliation`.
3. Confirm `RESEND_API_KEY`, `PIN2WIN_EMAIL_FROM`, and `PIN2WIN_PAYMENT_NOTIFICATION_EMAIL` are configured for administrator alerts and customer confirmations.
4. Confirm the Cron Jobs page in Vercel lists the daily 08:00 UTC job after deployment. The schedule is daily so it can deploy on Vercel Hobby; Pro may use a more frequent schedule after capacity and cost review.

Without `CRON_SECRET`, the scheduled endpoint rejects every request. No local or production job is executed just by building the application.

## Review and recovery

Open `/admin/reconciliation` with an individual administrator account. The page lists open and resolved issues, the last checkout scan time, and a manual “Run reconciliation now” action. A run processes another bounded batch. Open issues generate one administrator email alert when email delivery is configured; a failed alert remains pending. The administrator must review provider evidence before resolving a payment dispute or refunding anything—this job performs neither action.

- “Entry/payment mismatch” means the app recorded a successful checkout or entry, but Square did not currently verify that payment. Do not assume a refund or fraud; check Square’s order and payment history.
- “Entry without matching checkout” means an entry’s checkout ID, order ID, or amount does not match a stored Square checkout.
- “Checkout reconciliation failed” means the provider or application could not finalize the checkout. Review the Square order and server logs.
- “Confirmation email retry” means a verified payment has an entry but one or both confirmation audiences have not been delivered. Delivery state is tracked separately for staff and player, so a successful first audience is skipped on retry.

Issues are automatically marked resolved after a later successful check; their history remains in the database. The checkout and email lifecycle also writes transaction audit events.

## Limits and launch test

This is a provider sweep, not a durable application-managed webhook event inbox. Square retries failed webhook deliveries, and reconciliation independently finds payments even when a webhook is missed. Before enabling paid traffic, test delayed, duplicate, and failed Square webhooks; a paid checkout with no entry; an entry whose payment is not verified; and a staff-success/player-failure email retry using production-like staging credentials. Check that each issue appears in the dashboard, alerts arrive, and a second run does not create a duplicate entry or duplicate the already-delivered email audience.
