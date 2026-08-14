# Pin2Win Zapier Automation

These automations are optional, but they give Pin2Win a lightweight operating system while the platform is still early.

## 1. Partner lead tracking

Trigger: Catch Hook in Zapier.

Vercel environment variable:

```text
PARTNER_LEAD_ZAPIER_WEBHOOK_URL
```

Paste the Zapier Catch Hook URL as the value. When someone submits the partner inquiry form on `/contact`, Pin2Win sends Zapier:

```json
{
  "type": "partner_inquiry",
  "name": "Partner contact",
  "email": "contact@example.com",
  "phone": "210-555-0100",
  "venueName": "Example Golf Sim",
  "message": "Interested in Pin2Win",
  "source": "pin2wingolf.com/contact",
  "submittedAt": "2026-08-13T00:00:00.000Z"
}
```

Recommended Zapier actions:

- Add row to Google Sheets, Airtable, or another lead tracker.
- Send notification email to `pin2wingolf@outlook.com`.
- Create a follow-up task.

## 2. Customer follow-up

Trigger: Catch Hook in Zapier.

Vercel environment variable:

```text
CUSTOMER_FOLLOWUP_ZAPIER_WEBHOOK_URL
```

Paste the Zapier Catch Hook URL as the value. When an admin confirms or denies an entry, Pin2Win sends Zapier:

```json
{
  "event": "entry_decision",
  "decisionStatus": "Confirmed",
  "followUpType": "confirmed_entry_customer_followup",
  "entry": {
    "entryId": "P2W-ENTRY-20260813-0001",
    "playerName": "Customer",
    "playerEmail": "customer@example.com",
    "locationName": "Alamo Golf Den",
    "bayName": "Bay 1",
    "challengeSlug": "hole-in-one"
  },
  "sentAt": "2026-08-13T00:00:00.000Z"
}
```

Recommended Zapier actions:

- Filter to continue only if `decisionStatus` is `Confirmed`.
- Delay 2-4 hours.
- Send a follow-up email asking the customer to follow Instagram, tag Pin2Win, and book again.

## 3. Daily admin digest

Trigger: Schedule by Zapier.

Action: Webhooks by Zapier `GET`.

URL:

```text
https://pin2wingolf.com/api/admin/digest?days=1
```

Headers:

```text
Authorization: Bearer YOUR_DIGEST_SECRET
```

The endpoint uses `ZAPIER_ADMIN_DIGEST_SECRET` if it exists. If not, it falls back to `BOOKING_EMAIL_INTAKE_SECRET`.

Vercel environment variable:

```text
ZAPIER_ADMIN_DIGEST_SECRET
```

Recommended Zapier actions:

- Send an email digest to `pin2wingolf@outlook.com`.
- Include totals for booking clicks, booking emails logged, QR scans, matched scans, entries, and confirmed entries.
