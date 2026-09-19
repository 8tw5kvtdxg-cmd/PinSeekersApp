# Automatic payment alerts and refund claims

> Superseded by the owner’s subsequent instruction: automatic detection and alert emails are removed entirely. See CUSTOMER_REFUND_CLAIMS.md. The implementation described below is historical.

September 19, 2026

The scheduled reconciliation job previously inserted PaymentIssueClaim records when it detected a completed payment without an entry, archived paid entry, missing event code, or an unused entry on a held/closed challenge. It could reopen previously resolved automatic claims. The claim email worker then sent these detections as claim updates. A challenge changed to Draft can trigger the held/closed signal.

Automated detections now upsert staff-only PaymentReconciliationIssue records, keyed by issue type and checkout. Recovery resolves those alerts only. They do not create or reopen refund claims, generate claim events, or call the refund provider. Refund claims are created only by the authenticated customer submission flow. Square refunds still require administrator approval followed by an explicit refund request.

Untouched historical automatic claims remain preserved, including all events and delivery history, under Admin → Refunds → Historical automatic records. They are labeled as automatic detections, not customer submissions. Customer claims, human-reviewed cases, evidence-bearing cases, and actual refund attempts remain in the main queue. Pending historical detection emails are excluded; customer-submission emails, human decisions, and actual provider refund status updates remain enabled.

No records were deleted, no claim decisions changed, and no payment or refund was executed as part of this fix. No schema/data migration is required. Previously delivered email cannot be recalled. The code-path inspection does not constitute a production Square transaction audit.

Validation: regression coverage for repeated detections, internal-only recovery/reopening, unpaid/refunding exclusions, preserving real claims and refund attempts, and suppressing historical detection emails while retaining actual refund notifications.
