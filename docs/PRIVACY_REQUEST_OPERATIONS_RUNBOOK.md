# Privacy-request operations

This workflow is uncommitted and undeployed. It is an operational queue, not an automated deletion, correction, export, or legal determination. Counsel should confirm whether and how the Texas Data Privacy and Security Act applies to this business before deployment.

## Intake and review

Signed-in customers can submit access, correction, deletion, portable-copy, opt-out, and appeal requests at `/account/privacy`. People without an account can start a request at `/privacy-request` or through the existing email route in the approved Privacy Policy. A signed-in customer can appeal only a declined request associated with their own account; signed-out appellants use email with the prior request reference for separate verification. The queue records the request, account identity when available, response target, administrator actions, customer-facing messages, and an append-only event history. The initial target is 45 calendar days, with one documented 45-day extension recorded before the original target and explained to the customer. This follows the Texas statute as an operational target; the statutory applicability, exceptions, and authentication standard require counsel review.

An active account session is **not** enough to release sensitive exports or perform irreversible deletion. The administrator must separately document identity verification before a final decision and an external fulfillment/secure-delivery reference before marking any request Complete. Do not collect ID scans, tax IDs, or bank details in the text form, ordinary email, or review notes. Signed-in notifications say only that a secure update is available; signed-out customers receive the plain-language customer response by email, so it must never include an export or sensitive identifier. Declines must explain the reason and appeal route. If an appeal is denied, tell the customer how to submit a complaint to the Texas Attorney General.

The current queue has no safe data-export bundle, direct record-correction tool, deletion/anonymization engine, or data-sale/targeted-advertising switch. Signed-out requests enter the queue, but signed-out appeal and email intake still require manual queue entry and verified delivery of substantive responses. These gaps remain on the checklist. The daily authenticated cron retries queued privacy emails but does not alter the request or customer data.

## Retention and exceptions

Before deleting or anonymizing data, the owner and counsel must approve a record-type schedule covering accounts, account consents, checkouts, entries, refunds, dispute evidence, winner documentation, tax records, simulator evidence, security logs, and backups. Preserve records when required for accounting, chargebacks, fraud investigation, prize administration, legal holds, or other legal obligations. Record the specific exception and reviewer in the privacy-request decision. Do not use the ordinary account deletion button as a substitute for this review.

## Service-provider inventory to verify

The repository currently integrates or configures Vercel (hosting and cron), Postgres/Prisma (database; actual managed host to be confirmed), Square (checkout/refunds), Resend (transactional email), Payarc and Stripe (legacy or optional payment paths), and E6 or another simulator provider (attempt records). Partner venues may independently handle bookings and location data. This is a **candidate inventory**, not proof of current production contracts, data-processing agreements, locations, subprocessors, or sharing practices. The owner should verify actual providers, data categories, retention, access roles, and deletion/export support before publishing it as final.

Primary references: [Texas Business and Commerce Code chapter 541](https://statutes.capitol.texas.gov/Docs/BC/htm/BC.541.htm), [Texas Attorney General privacy-rights overview](https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint/consumer-privacy-rights/texas-data-privacy-and-security-act).
