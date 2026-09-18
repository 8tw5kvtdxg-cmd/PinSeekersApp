> Superseding clarification: compensation is not agreed. A possible $3–$4 per customer payment is under consideration. Read PARTNER_COMMERCIAL_TERMS.md; the no-revenue-share assumption below is historical, not approved.

# Pin2Win business readiness and partner growth review

Reviewed September 18, 2026. Current partner: Alamo Golf Den, San Antonio.

## Recommendation

Build Pin2Win around a measurable partner promise: **bring new people to the venue, help them have a good first visit, and give them a reason to return.** Offer the paid hole-in-one challenge as an optional additional experience. A visit without a challenge purchase can still be a successful partner outcome.

The platform has a substantial operational foundation, but I would not sign off on an unrestricted paid-challenge rollout yet. It is appropriate to prepare and promote ordinary partner bookings while closing the payment, eligibility, simulator-evidence, and support readiness gaps. These are separate launch decisions.

This is an engineering and business review, not a new legal approval. The existing checklist records owner-reported counsel acceptance; this review does not independently verify that approval, prize funding, insurance, or tax procedures.

## What was actually checked

- Read public customer, account, booking, checkout, admin, reporting, and recovery code; reviewed existing operations and partnership documents.
- Live HTTP checks: `/`, `/rent`, `/locations`, `/play`, `/account`, `/official-rules`, and `/refund-policy` returned 200. `/admin` and `/testing-portal` redirected unauthenticated visitors to admin login. Security headers were present on the checked admin response.
- Live `/robots.txt` and `/sitemap.xml` both returned 404. This is a discovery/configuration gap, not proof that Google cannot index the site.
- The external Golf918 booking URL returned 200 and a JavaScript application shell. This does not prove availability selection or booking/payment completion works.
- Local `npm test`: 48 passing tests, including six tests for the paused, undeployed SMS work. `npx tsc --noEmit`: passed. `npm run lint`: zero errors, seven warnings.
- Public partner website, FAQ, and pricing reviewed. Pricing page retrieved directly on the review date; confirm commercial details with the partner before using them in advertising.
- No purchases, refunds, customer outreach, reservations, or production application releases were performed for this review. No real-device checkout, complete browser accessibility audit, load test, restore drill, or real simulator-shot validation was completed.
- SMS MFA remains paused. The local workspace contains those unfinished deployment changes alongside the earlier admin-access fix. Do not deploy this mixed working tree casually.
- An optional isolated read-only production aggregate check remained in the hosting initialization queue and returned no database results. No production customer counts, current sale-setting values, acquisition rates, booking lift, or revenue totals are claimed in this review.

## Fix before increasing paid-challenge exposure

| Priority | Finding and evidence | Why it matters | Required result |
| --- | --- | --- | --- |
| P0 | Checkout accepts `locationSlug` and `bayName` from the request without looking up an active assigned venue/bay: `app/api/square/checkout/route.ts:99`. | A copied or altered URL can produce an entry with unsupported venue/bay data. QR possession is not proof of onsite presence. | Server resolves a real active venue/bay and challenge assignment; rejects missing, inactive, or mismatched assignments before creating a payment link. Agree and test an onsite-presence procedure suitable for this reservation-only venue. |
| P0 | Sales default to Open when settings are missing (`lib/hole-in-one.ts:28`); checkout does not enforce configured dates or the static challenge's Ready status. `lib/clubhouse.ts` retains blank dates and a fallback event code; `lib/clubhouse-challenge-settings.ts` falls back to that code. | A missing configuration can behave like a sale-ready challenge. | Default closed until explicitly activated with complete approved details; enforce date boundaries, active assignment, real simulator code, and pause/close state. Test direct API calls as well as screens. |
| P0 | New signup sets `emailVerifiedAt` immediately (`app/api/account/signup/route.ts:195`). `getCurrentVerifiedPlayer` checks only whether a session exists (`lib/player-auth.ts:170`). | “Verified email required” is not enforced. Domain/MX validation does not prove the player controls that mailbox. Incorrect addresses weaken recovery, confirmations, and customer matching. | Make the behavior and copy agree. Prefer actual email ownership verification, preserving the QR destination, with a clearly planned transition for existing accounts rather than silently treating old flags as proof. Admin email MFA is a separate control and is not bypassed by this player issue. |
| P0 | The checklist leaves real simulator evidence, unresolved chronology, prize funding/insurance confirmation, secure claim-document handling, and some closure/refund scenarios open. | The hardest business failure is a customer paying for an attempt whose result or remedy cannot be defended. | Run a supervised rehearsal: paid entry → authorized five-shot attempt → authenticated evidence → provisional result → review → closure and affected-entry handling. Obtain written operator/professional sign-offs where required. Do not claim vendor automation until demonstrated. |
| P1 | Password-reset token validity is read before the transaction, then marked used unconditionally inside it (`app/api/account/reset-password/route.ts:57–86`). | Concurrent requests can pass the same pre-check. This is a code-identified race; it was not exploited against production. | Atomically claim an unused, unexpired token inside the transaction before changing the password; invalidate sessions and outstanding login challenges; add a concurrent-use regression test. |
| P1 | Booking redirect trusts an arbitrary HTTP(S) `bookingUrl` parameter (`app/api/booking-link-clicks/route.ts:11,118,134`). Both logging routes trust client-supplied venue details. | The Pin2Win domain can redirect to an unrelated destination, and public writes can pollute partner metrics. | Accept only a venue identifier; resolve its approved HTTPS booking destination server-side. Bound/rate-limit telemetry and reject spoofed location data. Do not live-test hostile links or populate fake data. |
| P1 | Booking redirect awaits the analytics database write before redirecting, without a failure fallback (`app/api/booking-link-clicks/route.ts:125`). | A tracking failure can prevent a customer from reaching the partner booking page. | Resolve/validate the booking destination first; make telemetry bounded and best-effort so a logging outage never blocks booking. Test a simulated database failure. |
| P1 | Built-in Alamo listing wins over database records in `app/rent/page.tsx:65` and `lib/partner-locations.ts`; `/locations` is separately hard-coded. | Admin edits to the booking URL or inactive status may not control what customers see. This becomes more dangerous with additional partners. | One database-backed source for public venue name, status, booking URL, and contact details. Explicitly handle unavailable data without reviving a disabled venue. |
| P1 | QR scans are written during server-page rendering, and each located visit can send a staff email (`app/play/[challengeId]/page.tsx:50`). | Reloads and automated visits can inflate onsite activity; synchronous external work adds latency and notification noise. | Explicit, deduplicated scan events, bot/internal exclusions, bounded writes, and aggregated staff notifications. A “likely booking match” must remain distinct from authenticated check-in. |
| P1 | Admin funnel divides total QR page loads by booking clicks and entries by scans (`app/admin/funnel/page.tsx:296`). They are not linked visitor cohorts. `/locations` also links directly to Golf918 without the tracked booking button. | These ratios cannot establish booking conversion, acquisition, or repeat visits. They can exceed 100% or omit real referrals. | Report raw counts honestly until event-to-booking attribution exists; unify outbound links, track campaigns, and link completed bookings where the partner's system supports it. |
| P1 | Daily reconciliation is configured, but the inspected smoke test synthesizes audit events rather than exercising Square (`lib/live-flow-smoke.ts`). | A green unit suite does not demonstrate a real charge, delayed webhook, refund, email delivery, or simulator access. | Record a mobile rehearsal with an approved real/test payment plan. Verify webhook delay/duplicate handling, paid-without-entry recovery, refund status, and customer support. Monitor failed jobs and define staffed launch-hour response. |
| P1 | Admin authorization includes a historical hard-coded email the owner said was not theirs (`lib/admin-auth.ts`). | There is no evidence here that it is malicious, but its continuing access needs an explicit owner decision. | Review every authorized administrator, remove unapproved access, revoke affected sessions, and document who owns hosting/database/payment/email access. Verify backups and a restore drill. |

“P0” means before expanded paid-challenge launch. It does not mean that ordinary venue booking promotion must stop. “P1” means address during the immediate readiness sprint. The source references are review pointers; line numbers will change as fixes land.

## Improve before spending materially on acquisition

1. **Create a complete Alamo landing page.** Lead with what a visitor can do, who it suits, how to book, and how arrival works. Include approved real venue photos, available clubs, reservation-only access, session length guidance, current pricing link, address/directions, and help contact. Primary action: book simulator time. Secondary: learn about the optional challenge. No Pin2Win account should be needed merely to discover or book the venue.
2. **Rewrite the customer-facing message.** “Operations console,” “location-level logs,” and “activation” describe internal systems. Customers need to understand the experience, total cost, and next step. Put partner-acquisition messaging on a separate partner page. Explain that bay time is paid to the venue and the $20 challenge is separate and optional.
3. **Make challenge details visible before an automatic checkout handoff.** Keep returning-player convenience, but ensure the price, five-shot format, play window, venue/bay, settings, rules, and support are unambiguous. Do not add repeated consent screens casually; resolve the existing grandfathered-account policy deliberately.
4. **Add search/share foundations.** Unique page titles/descriptions, canonical URLs, accurate social preview images, sitemap, intentional robots/noindex behavior, Search Console verification, and appropriate structured data. Do not publish fake review stars or claim a second physical business listing at the partner's address.
5. **Complete mobile and accessibility review.** Test iPhone Safari and Android Chrome at the venue: form errors, keyboard focus, labels, contrast, menu, deep links, QR context, Square handoff, session expiry, recovery, and slow connection. The seven lint warnings are lower priority than those actual flows.
6. **Make deployments reproducible.** Separate paused SMS work from the release candidate; version the tested release and maintain a rollback reference. Confirm production environment and migration state before release. Avoid adding new features until the pilot acceptance checklist passes.

## Partner offer and document alignment

The September 16 field playbook states **no revenue share or commissions**: Alamo keeps its booking/onsite revenue; Pin2Win keeps separate challenge-entry revenue. The older `Pin2Win_Partner_Commercial_Proposal.md` and its PDF still propose 20% revenue share, a $500 hybrid, and $1,000 rent. These materials conflict. Treat the current field playbook as the working assumption, confirm the signed agreement, then archive or replace outdated proposals before further outreach. Do not imply the older scenarios are the agreed current arrangement.

Suggested positioning:

> Pin2Win helps indoor golf venues attract first-time visitors and turn them into regulars through local promotion, easy booking referrals, and optional golf challenges—with clear reporting on what the partnership produces.

Deliver a small, dependable service each month: one focused campaign, reusable approved venue content, a booking/referral pathway, a return-visit experiment, a weekly short check-in, and a monthly results recap. Bound the time and advertising budget. A new venue should know exactly what Pin2Win will do and what staff help is needed.

## Thirty-day Alamo growth pilot

These are proposed experiments and planning targets, not guaranteed traffic or revenue. Marketing budget, actual unused capacity, existing customer permissions, and booking-system reporting access were not supplied when this draft was prepared.

| Timing | Work | Evidence of completion |
| --- | --- | --- |
| Days 1–3 | Meet the partner; select two genuinely underused booking windows. Review the previous four comparable weeks of completed bookings, hours sold, cancellations, and first/repeat customers if available. Agree staff involvement, asset approvals, data access, and a budget cap. | A baseline sheet, approved campaign brief, and named contacts. |
| Days 4–7 | Complete the venue landing page and trusted tracked booking links. Film one arrival/setup walkthrough plus short clips showing friends playing and solo practice. Review the partner's existing Google Business Profile with its permission. | Booking path tested; content approved; hours/booking link/photos accurate; campaign identifiers recorded. |
| Week 2 | Run one newcomer session or small group experience in an agreed quiet window. Recruit through nearby employers, apartment communities, local golf instructors/clubs, and community groups that permit relevant posts. Begin with 10 qualified local contacts and two venue-focused short videos per week if capacity allows. | Completed visits and attendance source; first-visit feedback; support/staff time. No messages sent as part of this review. |
| Week 3 | Run one return-visit experiment through the partner's existing permitted communication channel. Offer a concrete next visit: a regular practice slot, bring-a-friend session, or small recurring social group. Suppress invitations for people already rebooked or with unresolved issues. | Rebookings, completed second visits, incentive cost, unsubscribes/complaints where relevant. |
| Week 4 | Review completed booking outcomes, not just reach. Retain the winning message/time slot. Write a factual one-page case study and next-month plan with partner approval. | An owner-reviewed scorecard, campaign cost, operational burden, and a decision to repeat/change/stop. |

### Three messages to test

- **First visit:** a private indoor golf experience for friends, with a simple arrival/setup walkthrough. Lead with the experience; explain that no challenge purchase is required.
- **Practice:** a predictable early/late or weekday practice session for people who want regular repetition. Select the time from real spare capacity rather than assuming all weekdays are quiet.
- **Small groups:** a private client outing or team session, with capacity, booking duration, and equipment confirmed by the venue. Avoid selling a large event until actual capacity and staffing are known.

Alamo's FAQ says clubs are available, access requires a reservation, and simulators are available 24/7. It suggests one hour for 1–2 players and two or more hours for groups of 3–4. Those facts support newcomer and group messaging without inventing amenities. [Partner FAQ](https://alamogolfden.com/faq)

The directly retrieved pricing page lists $40/hour overnight/early morning (10 PM–10 AM), $50/hour weekday daytime, and $60/hour peak evenings/weekends. Do not label weekday daytime as the venue's published “off-peak” rate; its published off-peak window is overnight/early morning. Verify rates before publishing an offer. Start by testing better packaging and explanations, not blanket discounts. [Partner pricing](https://alamogolfden.com/pricing-%26-memberships)

### Acquisition order

1. **Remove booking uncertainty.** Show the door/arrival process, included equipment, and reservation requirement. A 24/7 reservation-only venue needs particularly clear first-visit instructions; do not assume a front desk is staffed.
2. **Improve the existing Google Business Profile.** With partner permission, check accurate category, address, hours, real images, and a booking link. Google identifies relevance, distance, and prominence as local ranking factors; no position is guaranteed. [Google guidance](https://support.google.com/business/answer/7091?hl=en)
3. **Use nearby relationships and real venue content.** Ask organizations to share a specific approved session, not a generic “follow our page” request. Give each source its own link or booking reference. Do not contact anyone without authorization.
4. **Ask all eligible visitors for an honest review.** Keep review requests separate from rewards; do not reward positive reviews, gate requests on satisfaction, or offer discounts for reviews. [Google review policy](https://support.google.com/business/answer/3474122?hl=en)
5. **Test paid local acquisition only after conversion tracking works.** Start with a capped, partner-approved experiment for ordinary simulator bookings. Review ad-platform eligibility for any paid-entry cash-prize promotion before using challenge creative; the classification is not established by this review. Both ad content and destination must accurately represent the offer. [Google games advertising policy](https://support.google.com/adspolicy/answer/15132179?hl=en)

### Retention sequence

Use the partner's existing communication tools and permission records initially. Receiving a booking confirmation or creating a Pin2Win account is not automatically a subscription to marketing.

- Before visit: venue-controlled arrival/access instructions and a short setup video.
- After visit: a feedback invitation and help resolving any problem; optional honest review request presented consistently.
- Roughly one week later, for permitted marketing recipients: a specific next-session suggestion suited to practice or social play. Do not send if already rebooked.
- Around three to four weeks later: one relevant reactivation invitation for eligible customers who have not returned. Stop on opt-out; measure completed visits rather than message opens.

Keep any return credit modest, approved by the venue, and targeted to genuinely underused capacity. Reward a real return/referral if the economics work; never tie the reward to a Google review. Build a new loyalty system only if manual experiments prove recurring demand.

## Measurement that protects the partner relationship

The main outcome should be **incremental completed venue visits and booked bay-hours**, with sustainable cost and acceptable staff burden. Challenge entries are a second outcome.

| Metric | Definition / caution |
| --- | --- |
| Qualified booking traffic | Unique relevant visitors reaching a booking action, excluding known internal/test activity; report raw clicks separately. |
| Attributed completed bookings | Non-cancelled, completed reservations linked by supported booking integration, campaign reference, or disclosed self-report. Label the evidence level. A click alone is not a booking. |
| First-time visitors/bookers | New to the venue according to its available history. A new Pin2Win account is not proof of a new venue customer. If attendee data is unavailable, report new booking customers, not all visitors. |
| Repeat rate | First-time customers with a completed second visit within 30 days divided by the first-time cohort with a full 30-day observation window. Do not count future reservations as completed returns. |
| Target-window utilization | Completed booked bay-hours divided by genuinely available bay-hours in the selected windows. Compare equivalent days/times and note events, closures, holidays, and small samples. |
| Partner revenue | Venue-confirmed net booking receipts, with cancellations/refunds separated. Do not multiply every click by the posted hourly rate. |
| Challenge attachment | Actual eligible participants buying a challenge, using a consistent player denominator. If only bookings are known, report entries per booking and do not call it a participant conversion rate. |
| Cost and burden | Campaign spending, creative/offer cost, Pin2Win hours, venue staff minutes, customer issues, refunds, and partner satisfaction. |

Use a weekly scorecard even if initially a spreadsheet. Tag channels such as Pin2Win social, partner social, Google profile, employer outreach, and apartment outreach. Use opaque identifiers rather than emails/phone numbers in URLs. If Golf918 cannot preserve a referral identifier, use a supported source field or venue-approved reference and be candid about uncertain attribution. Imported booking confirmations show bookings exist; they do not show Pin2Win caused them. Maintain partner data permissions and do not expose one venue's customers to another.

## Pin2Win economics and expansion decision

Partner value and Pin2Win sustainability must both be visible. Under the no-revenue-share model, a customer who books Alamo without entering the challenge creates partner value but no direct challenge revenue for Pin2Win. That is worthwhile within a defined pilot budget, but cannot justify unlimited acquisition spending.

Track net contribution from challenge entries after payment costs, refunds, prize funding/insurance allocation, direct support, and campaign costs. Compare it with the time and money used to acquire and retain those customers. Do not fund advertising from the full $20 entry fee as if it were profit, and do not infer a prize risk rate from the advertised $5,000 amount. Any sponsorship or separately paid marketing package is a future commercial option to test, not an assumed current agreement.

Expand partner sales after one venue can credibly show: an operating booking path; a safe, rehearsed challenge flow; some attributable completed bookings; a measured repeat cohort; acceptable support/staff workload; an owner willing to endorse the experience; and a repeatable delivery cost. A case study should state dates, counts, attribution method, costs, and limitations. Continue qualified venue conversations, but avoid promising unsupported booking uplift or scalable simulator integration.

## Recommended next implementation order

1. Separate the paused SMS branch/work from the release candidate; confirm current admin access and approved administrators.
2. Repair challenge sale/venue/bay validation, real email verification, and password-reset single-use handling; complete the operational challenge launch gates.
3. Make partner booking links trusted and resilient; use one venue data source and correct the misleading funnel metrics.
4. Build the Alamo customer landing page and search/share foundations, with approved assets and clear optional-challenge wording.
5. Establish the partner baseline and weekly scorecard; run one acquisition experiment and one retention experiment.
6. Complete a recorded mobile/venue rehearsal and release only the accepted scope. Measure results before expanding features or paid media.
