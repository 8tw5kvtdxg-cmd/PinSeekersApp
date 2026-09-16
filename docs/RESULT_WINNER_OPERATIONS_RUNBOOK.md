# Hole-in-One Result and Winner Operations

This engineering workflow is provisional. The new `/admin/prize-claims` queue separately records potential-winner notice, response, eligibility, secure-document statuses, final review, CPA-procedure status, payout approval, and an externally completed payout. It does not collect document bytes or tax IDs, transfer money, determine an equal split or successor, or decide a refund. Those actions require the remaining counsel, CPA, and finance procedures.

## Separate potential-winner claim

Only a verified paid result currently named as the unique provisional leader can open a potential-winner claim. An individual MFA administrator records a substantive note. The notice email uses a stable provider idempotency key; the ten-calendar-day response target starts only when Resend accepts the notice. Do not send W-9s, ID scans, tax IDs, or bank details through ordinary email. An administrator must arrange and record a separate secure collection method, then record the identity, residency, affidavit, and W-9 **statuses only**. The claim cannot be finalized until response, eligibility, and document checks are marked verified and chronology still names this report. Payout approval additionally requires a recorded CPA-approved tax procedure. The Paid action records an external transfer; it never moves money from the app. A changed chronology, disqualification, refusal, or equal-time review needs separate counsel-guided successor or split handling.

If a later verified simulator shot changes or invalidates provisional chronology, any existing potential-winner claim is suspended in the same transaction with an attributed event. A claim whose payout was already recorded is explicitly marked **Paid - Chronology Review** for urgent counsel/finance review; nothing is automatically clawed back or reassigned. Notice and payout target dates are shown in the admin queue, but venue holidays and final document receipt must be checked manually.

The precise reporting form and withholding procedure remain CPA decisions. Current IRS instructions distinguish non-wager prizes reported on Form 1099-MISC from wager-based winnings reported on Form W-2G. Do not infer the form from the document draft alone. [IRS 2026 Form 1099-MISC instructions](https://www.irs.gov/instructions/i1099mec), [IRS 2026 Form W-2G instructions](https://www.irs.gov/instructions/iw2g).

## Potential result intake and sale hold

A signed-in player with an active paid entry can report that the authorized simulator recorded the ball holed from the designated tee in one eligible stroke. The report is rate-limited and one per entry. The report and an append-only event are stored in the database, and new checkout/entry creation is paused in the same transaction. The report is **not** verified by the player's statement.

The simulator integration must submit a separate authenticated record to `POST /api/simulator/hole-in-one` using `PIN2WIN_SIMULATOR_API_SECRET`. Administrator cookies are not accepted as simulator evidence on this endpoint. The payload requires `entryId`, `provider`, `sessionId`, `shotId`, ISO-8601 `shotAt`, `playerAlias`, `venueName`, `bayName`, `evidenceReference`, `strokeCount: 1`, `ballHoled: true`, and `designatedTee: true`. The API rejects a shot older than its paid entry, mismatched player alias, duplicate conflicting shot, missing evidence, or a shot dated in the future. An actual vendor or local-agent integration still needs to supply and independently validate these records.

The new-sale gate stops application-issued Square checkout links, legacy Payarc checkout when enabled, and new venue-booking entries. A Square link issued **before** the hold may remain payable at Square. Identifying and refunding any resulting unusable paid entries is still outstanding; do not assume this hold cancels external links.

## Individual review

Open `/admin/winners` after signing in with an individual administrator account and email MFA. Review the registered entry, payment and entry confirmation, simulator player alias, venue and bay, session and shot IDs, evidence reference, designated-tee/one-stroke flags, shot timestamp, configured challenge period, and immutable review history. Confirm the entry in the separate entry review workflow before verifying a result.

Verification is blocked unless the challenge period is explicitly saved in database settings, the shot falls within it, and the entry has a concrete venue and bay matching the authenticated simulator record. The old hard-coded May 2026 dates are not accepted as a production winner period. Each decision requires a substantive attributed note and server-generated UTC verification time.

After a pending or verified report exists, a configured event code and challenge period cannot be changed through the normal admin settings screen. The verification event records the period, shot, entry, venue, bay, timestamp-reliability judgment, and actor as a historical snapshot. A pending or verified report blocks entry archival; a verified report also blocks ordinary entry denial. Any later disqualification must be a separate attributed workflow rather than silently changing the evidence underneath chronology.

When an administrator verifies a simulator-backed result, the result, entry summary, review event, provisional chronology, and sale closure are committed together in a serializable database transaction. A concurrent transaction conflict is retried. Provisional priority uses simulator shot time, not report or review time. Identical earliest timestamps, or any verified timestamp marked unreliable by the verifier, put chronology in **Chronology Review** with no provisional leader. More reliable evidence and the counsel-approved equal-split process are needed before any final winner decision.

Reject a false report only after adequate evidence review. If every report is rejected and none is pending or verified, an administrator can resume new sales with an attributed reason. Do not resume while an unresolved potential result exists.

## Launch rehearsal still required

Use a production-like staging database and simulator integration to test report/hold races, issued Square links, duplicate simulator shots, delayed evidence, mismatched aliases/venues/bays, concurrent administrator verification, earlier shots reported later, equal timestamps, unreliable timestamps, closure, and refunds for unusable paid entries. Verify that no path can award or advertise a final winner from a player statement or closest-to-pin distance alone.
