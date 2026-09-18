# Supervised launch rehearsal — NOT YET PERFORMED

The founder will supply the final simulator settings, approved bay, dates, funding or insurance confirmation, and onsite operator. Software checks do not establish simulator compatibility, prize coverage, or operational readiness. Keep sales Draft until the supervised rehearsal passes and its evidence is recorded.

## Record before rehearsal

Record the challenge slug, venue and bay IDs, course, hole, tee, pin, distance, simulator settings/version, event code, timezone and opening/closing dates. Name the onsite operator, result reviewer, refund operator, and escalation contact. Store the prize funding/coverage approval reference and confirm that it applies to the exact challenge configuration. Keep sensitive documents in restricted storage; put references, not customer secrets or payment details, in admin notes.

Use Square sandbox and a staging database for payment rehearsal; never mark a production challenge ready merely to bypass its guard. A supervised production smoke purchase/refund requires an explicitly coordinated test window after other gates pass. Keep evidence of what was tested in each environment.

## Test record

For every row record date, operator, expected/actual result, checkout/entry/refund identifiers, restricted evidence link, and pass/fail. No row is pre-certified.

| Scenario | Required result | Status |
| --- | --- | --- |
| Draft, incomplete settings, dates not started/ended | Server rejects checkout and creates no entry | Awaiting supervised test |
| Inactive/unassigned venue or bay, altered QR parameters | Server rejects checkout | Awaiting supervised test |
| Signup from approved QR | Email begins unverified; verification restores correct challenge, venue and bay | Awaiting supervised test |
| Missing/expired/reused email link and resend failure | No verification bypass; recoverable customer message | Awaiting supervised test |
| Partner booking with telemetry failure | Correct approved booking page still opens | Awaiting supervised test |
| Square payment cancelled/declined | No paid entry or event access | Awaiting supervised test |
| Successful payment; duplicate webhook and browser callback | One paid entry and one entitlement; correct receipt and consent references | Awaiting supervised test |
| Simulator session | Exact configured course/hole/tee/settings, correct player, one five-shot attempt and 15-minute window; capture authoritative evidence | Awaiting supervised test |
| Missing/disputed simulator result | Review queue, preserved evidence and named reviewer; no unsupported result or prize promise | Awaiting supervised test |
| Potential winning shot | Sales pause, preserve evidence, verify eligibility/configuration, start documented prize review | Awaiting supervised test |
| Stale payment link paid after pause/close/end | Reconcile payment, block new entitlement, named operator reviews refund; customer receives support path | Awaiting supervised test |
| Closure with outstanding entries | Preserve paid player rights according to applicable rules; reconcile unused/affected entries individually | Awaiting supervised test |
| Full refund, retry, pending/failure | Processor confirmation matches internal status and audit log; no duplicate refund | Awaiting supervised test |
| Prize approval/rejection and payout record | Authorized reviewer, evidence and funding reference, notices, recorded decision and payment reference | Awaiting supervised test |
| Confirm completed venue visit and later repeat visit | Separate outcome and source evidence; corrected outcomes retained in audit history | Awaiting supervised test |

## Closeout

Record unresolved defects, who owns each, and the retest result. Reconcile Square totals with checkout, entry, refund, and prize records. Retain a restricted signed report with operator and owner approval. In Admin → Challenge Setup save the final configuration, approved bays and readiness reference; check evidence/funding/rehearsal boxes only when their underlying checks have passed. Then set Open for the agreed dates. Keep Draft/Paused if anything remains unresolved.

Partner compensation is separate and undecided. Do not calculate or send payouts from the proposed $3–$4 figure without an agreed qualifying-payment definition and signed terms.
