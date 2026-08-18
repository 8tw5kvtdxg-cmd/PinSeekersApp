# Pin2Win Platform Functionality Brief

Prepared for investor review

## Executive Summary

Pin2Win is a golf entertainment and marketing platform built to help simulator venues offer paid challenge experiences to their existing customers. The platform supports a partner-location model where customers discover participating venues, book simulator time through the partner's existing booking system, scan an onsite QR code, register for the challenge, and receive access to the simulator challenge experience after verification.

The current platform is designed around a focused initial launch with Alamo Golf Den and a Hole-In-One Challenge. The product has been intentionally narrowed to one clear offer, one customer path, and an admin workflow that supports partner operations, booking verification, entry review, customer communication, and performance tracking.

## Current Business Model Support

The platform supports Pin2Win as a golf entertainment and marketing company for partner simulator venues. Its current workflow is designed to work with partners that already have their own booking and facility-access systems.

The platform currently supports:

- Partner location discovery
- Partner booking-page redirection
- Onsite QR-code challenge access
- Booking email intake and verification
- Customer challenge registration
- Admin review and confirmation
- Event-code reveal workflow
- Partner-level analytics
- Customer and admin email notifications
- Zapier automation hooks for lead tracking and follow-up

## Connected Apps and Technology Stack

Pin2Win is built as a connected platform rather than a single standalone website. The current functionality is made possible by a combination of custom software, hosting infrastructure, partner systems, payment tools, email services, and automation apps.

### Core Platform

- Pin2Win web platform: Customer-facing website, QR landing pages, admin portal, partner-location management, booking verification, analytics, and entry review.
- Next.js and React: Application framework used for the website, customer flows, admin portal, and API routes.
- Prisma: Database access layer used to manage production records such as locations, booking clicks, QR scans, booking verifications, users, and related operational data.
- PostgreSQL database: Production data store used for key platform records and analytics.
- Vercel: Production hosting and deployment platform for `pin2wingolf.com`.
- GitHub: Source-code repository and deployment source connected to Vercel.

### Partner and Venue Systems

- Golf918: Alamo Golf Den's booking system. Pin2Win links customers to the Golf918 booking page and uses booking confirmation emails as the source for booking verification automation.
- Alamo Golf Den booking page: Current launch partner booking destination used in the Book Your Bay flow.
- Simulator software platforms: The platform currently supports manually entered simulator event/access codes and is intentionally written broadly so Pin2Win can support E6, Trackman, Golfzon/Golfzon-style systems, Garmin, GC/foresight-style systems, or other simulator software as partners expand.
- Partner facility access systems: Pin2Win can operate alongside a venue's existing access-code or door-code process without replacing it.

### Payment and Merchant Tools

- Payarc: Intended production payment provider, pending merchant setup and approval. Payarc routes and webhook structure are already present in the platform.
- Stripe: Previously used for checkout testing, but no longer the preferred production payment path after account restrictions.
- Partner payment systems: The current launch approach can work alongside a partner's own booking/payment system while direct Pin2Win checkout is finalized.

### Email and Communication Tools

- Resend: Transactional email service used by the platform for account verification, entry confirmation/denial, payment/entry notifications where applicable, and QR-scan/admin notifications.
- Outlook: Pin2Win business email inbox at `pin2wingolf@outlook.com`, used for operational communication, admin notifications, and partner/customer follow-up.
- Domain DNS records: Required to verify email sending and improve deliverability through SPF/DKIM/DMARC records.

### Automation and Operations

- Zapier Email Parser: Used to receive Golf918 booking confirmation emails and extract booking details.
- Zapier Webhooks: Used to send parsed booking data into the Pin2Win booking intake endpoint.
- Zapier Catch Hooks: Used for partner-lead tracking and customer follow-up automations.
- Zapier Schedule: Can be used to call the daily admin digest endpoint and email Pin2Win a daily operating summary.

### Marketing and Social Presence

- Instagram: Pin2Win's public social profile is active at `https://www.instagram.com/pin2wingolf/`.
- Zapier follow-up workflows: Can prompt confirmed customers to follow Pin2Win, tag the brand, share content, and return to partner locations.
- Partner website and social channels: Partner venues can promote Pin2Win as an added entertainment experience at their location.

### Current Integration Philosophy

The platform is intentionally designed to work with tools that partners already use. Rather than forcing every venue to change booking systems, payment systems, or facility access systems immediately, Pin2Win can connect around those systems through booking links, email automation, QR flows, admin review, and partner-level analytics.

## Customer-Facing Website

The public website introduces Pin2Win as a challenge experience available at partner locations. It avoids positioning the platform as only a prize or gambling concept and instead presents the business as an entertainment and marketing service.

Current public site functionality includes:

- Home page focused on the customer challenge experience
- Locations page for finding participating partner venues
- Book Your Bay flow that lets customers choose a partner location
- Redirect tracking when customers click a partner booking link
- Partner inquiry/contact page for prospective venue operators
- Instagram/social presence link support
- Broad simulator-language positioning so the platform is not limited to one simulator software provider

## Partner Location Booking Flow

Pin2Win does not currently replace a partner's existing booking system. Instead, it supports each partner by linking customers to the partner's own booking page.

For Alamo Golf Den, the platform links to:

```text
https://alamogolfden.golf918.net/embed/y1snhpyhqamwoh5xo4lml
```

The platform logs booking-link clicks by partner location. This helps Pin2Win understand how many customers are being sent to each partner's booking page.

This approach allows Pin2Win to launch without requiring a full scheduling integration or taking over a venue's normal booking operations.

## Onsite QR Challenge Flow

The QR challenge page is intentionally not promoted in the public navigation. It is meant to be accessed only when a customer is physically present at a partner location and scans a posted QR code.

The QR landing page currently focuses on:

- Hole-In-One Challenge
- $20 entry
- Customer registration
- Booking/payment verification
- Event-code reveal after the entry is approved

The QR page supports location-aware tracking so the admin portal can measure onsite scan activity by partner.

## Booking Email Automation

The platform includes an automated booking intake endpoint designed to receive booking confirmation data from Zapier or another automation tool.

Endpoint:

```text
POST https://pin2wingolf.com/api/booking-email-intake
```

This endpoint accepts booking confirmation data from Golf918-style emails and creates a booking verification record inside the Pin2Win database.

The system currently parses booking details such as:

- Customer name
- Customer email, when available
- Partner location
- Bay number
- Reservation date and time
- Reservation duration
- Booking email subject and raw email body

This allows Pin2Win to know when a valid partner booking exists and compare that booking against onsite QR scans.

## Booking Verification System

Booking verification records are stored in the production database. This replaced an earlier local-file approach so the workflow is compatible with Vercel production hosting.

Booking records can be:

- Created automatically through booking email intake
- Created manually in the admin portal
- Matched to QR scans
- Marked as used after a challenge entry is created
- Reviewed by admin when a match is unclear

This is important for launch because Pin2Win can operate with a partner's existing booking system while still maintaining its own operational record of eligible challenge participants.

## Admin Portal

The admin portal is the operational control center for Pin2Win. It includes navigation across the main business functions and is designed to support partner management, booking verification, challenge administration, and analytics.

Current admin areas include:

- Dashboard
- Booking Queue
- Analytics
- Entries
- Results
- Review
- Event Code
- Locations
- Users

The admin navigation is accessible across admin pages, making the portal easier to operate during live testing.

## Partner Location Management

The admin portal supports partner location management.

Admin users can:

- Add new partner locations
- Edit existing locations
- Add or update location websites
- Add or update booking-page URLs
- Select simulator software/provider
- Add custom simulator software names
- Generate and view location-specific QR codes
- View partner readiness information

This prepares the platform to scale beyond Alamo Golf Den to additional simulator venues.

## Event Code Management

The platform supports event-code management in the admin portal. The event code is currently entered manually by the admin after the simulator challenge is created by the venue or simulator software provider.

The event-code workflow is intentionally broader than E6-only language so Pin2Win can support other simulator platforms in the future.

Current approach:

- Partner or admin creates the challenge in simulator software
- Simulator software generates an event/access code
- Admin enters that code into Pin2Win
- Customer receives/reveals the event code after verification
- Customer enters that code on the simulator software interface at the venue

## Entry Review and Confirmation

The admin portal includes an entry review process. Entries can be reviewed in a table-style format, with details accessible per entry.

Admin users can:

- View challenge entries
- Confirm an entry
- Deny an entry
- Send confirmation or denial emails
- Notify Pin2Win and the entrant
- Mark booking verification records as used after successful entry creation

This gives Pin2Win operational control during the proof-of-concept stage.

## Email Notifications

The platform currently supports email notifications through Resend.

Email-supported workflows include:

- Account email verification
- Entry confirmation/denial emails
- Payment/entry confirmation emails where applicable
- QR scan notifications
- Admin/customer notification flows

Pin2Win email recipient:

```text
pin2wingolf@outlook.com
```

The platform can send emails to both the entrant and Pin2Win when admin decisions are made.

## Zapier Automation Support

Zapier support has been added to extend platform operations without requiring custom integrations for every tool.

Current Zapier-supported workflows include:

### Partner Lead Tracking

The partner inquiry form can send lead data to Zapier through:

```text
PARTNER_LEAD_ZAPIER_WEBHOOK_URL
```

This can trigger:

- Email notification to Pin2Win
- CRM entry
- Spreadsheet logging
- Follow-up task creation

### Customer Follow-Up

When an admin confirms or denies a customer entry, the platform can send that event to Zapier through:

```text
CUSTOMER_FOLLOWUP_ZAPIER_WEBHOOK_URL
```

This can trigger:

- Delayed customer follow-up emails
- Instagram/social follow requests
- Customer feedback requests
- Rebooking prompts

### Daily Admin Digest

The platform includes a digest endpoint:

```text
GET https://pin2wingolf.com/api/admin/digest?days=1
```

Zapier can call this on a schedule and email a daily summary to Pin2Win.

The digest can include:

- Booking-link clicks
- Booking verifications
- QR scans
- Matched QR scans
- Unmatched scans needing review
- Entries
- Confirmed entries

## Analytics and Funnel Tracking

The admin portal includes partner-level funnel analytics.

Current analytics include:

- Booking clicks by partner
- QR scans by partner
- Matched QR scans
- Unmatched scans needing admin review
- Entry counts
- Confirmed entry counts
- Scan rate
- Entry rate
- Latest activity by partner

This gives Pin2Win visibility into how well each partner location converts customer interest into onsite challenge participation.

## Launch Testing Tools

The admin portal includes launch-readiness tools for testing partner locations.

These tools help validate:

- Partner location setup
- Booking URL availability
- QR-code routing
- Challenge/event-code availability
- Entry flow readiness
- Admin review workflow

This is especially useful before running a live test with Alamo Golf Den.

## Payment Status

The platform previously used Stripe Checkout, but Stripe restricted the account due to concerns around prize-based games. Pin2Win is pursuing Payarc as the intended payment provider.

Current payment-related status:

- Stripe is no longer the preferred production payment path
- Payarc routes and webhook structure exist in the platform
- Full Payarc launch depends on merchant approval/setup
- The platform can continue testing booking verification and admin workflows while Payarc setup is pending

## Current Launch Partner

Current initial partner:

```text
Alamo Golf Den
7001 I-10 #225
San Antonio, TX 78213
https://alamogolfden.com
```

Alamo Golf Den currently uses Golf918 for bookings and Payarc through its existing booking workflow.

The current proof-of-concept launch approach is to offer the challenge to existing Alamo customers while they are onsite at the bay.

## Near-Term Test Plan

The next practical test is an end-to-end booking and QR scan workflow with Alamo Golf Den.

Recommended test steps:

1. Alamo generates a test Golf918 booking confirmation.
2. Booking email is sent or copied to the Zapier parser mailbox.
3. Zapier posts the booking data to Pin2Win.
4. Admin confirms the booking appears in the Booking Queue.
5. Customer scans the onsite QR code during the booking window.
6. Pin2Win logs the QR scan.
7. Platform attempts to match the scan to the booking.
8. Customer registers for the Hole-In-One Challenge.
9. Admin reviews and confirms the entry.
10. Customer and Pin2Win receive confirmation email.
11. Customer receives the simulator event code and starts the challenge.
12. Admin reviews analytics after the test.

## Investor-Relevant Platform Strengths

Pin2Win currently has several important early-stage strengths:

- It works with a partner's existing booking infrastructure.
- It does not require immediate replacement of venue operations.
- It supports scalable partner-location management.
- It tracks customer funnel activity by location.
- It supports onsite-only QR access.
- It includes admin review controls for early operational safety.
- It supports automation through Zapier.
- It is positioned broadly enough to support simulator platforms beyond E6.
- It is focused on a simple launch offer: Hole-In-One Challenge.
- It can generate useful operating data during a proof-of-concept launch.

## Current Limitations and Open Items

The platform is close to pilot readiness, but several items remain important:

- Payarc merchant approval and production payment setup are still pending.
- The booking email automation needs live partner testing.
- Customer email visibility from partner booking confirmations needs to be confirmed.
- The live QR-to-booking match should be tested during an actual booked time slot.
- Prize/legal/compliance positioning should continue to be reviewed carefully.
- Long-term entry storage should eventually move fully into the production database.
- Zapier trial limitations should be reviewed before relying on paid automations long term.

## Recommended Next Steps

The best next step is to complete a controlled live pilot with Alamo Golf Den.

Priority actions:

1. Complete Zapier booking email test with an Alamo-generated booking.
2. Confirm Payarc merchant setup path.
3. Run one onsite QR scan and challenge registration test.
4. Confirm admin review and email confirmation behavior.
5. Review admin analytics after the test.
6. Decide whether to keep Zapier or move automations to another service.
7. Prepare partner-facing sales materials using the pilot data.

## Closing

Pin2Win has moved beyond a basic landing page into a functional early-stage platform. It now includes partner discovery, booking funnel tracking, QR-based onsite challenge access, booking verification, admin controls, email notifications, automation hooks, and partner-level analytics.

The platform is well positioned for a controlled proof-of-concept launch with Alamo Golf Den, with the key remaining dependency being payment-provider readiness and live workflow testing.
