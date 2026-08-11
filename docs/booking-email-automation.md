# Booking Email Automation

Use this workflow to automatically add partner booking confirmation emails to the Admin Booking Queue.

## Endpoint

`POST https://pin2wingolf.com/api/booking-email-intake`

## Authentication

Create a Vercel environment variable:

`BOOKING_EMAIL_INTAKE_SECRET=your-long-random-secret`

Send the same value in either header:

`Authorization: Bearer your-long-random-secret`

or:

`x-pin2win-intake-secret: your-long-random-secret`

## JSON Body

```json
{
  "toEmail": "jane@example.com",
  "locationSlug": "alamo-golf-den",
  "locationName": "Alamo Golf Den LLC",
  "externalReference": "Golf918 confirmation 12345",
  "rawEmailSubject": "Booking confirmation",
  "rawEmailText": "Original email body"
}
```

For Golf918-style emails, Pin2Win parses these fields from `rawEmailText`:
- customer first name from `Hi Brad,`
- partner name from `Alamo Golf Den LLC`
- bay name from `Bay 1:`
- reservation start from `08/11/2026 3:00 PM CDT`
- reservation end from `for 90 minutes`

The automation should still provide `toEmail` or `customerEmail`, because the
sample Golf918 body does not include the customer email address.

## Power Automate Outline

1. Trigger: When a new email arrives in Outlook.
2. Filter: Sender or subject contains the partner booking confirmation pattern.
3. Map the recipient email to `toEmail`.
4. Action: HTTP POST to `/api/booking-email-intake`.
5. Header: `Authorization: Bearer <BOOKING_EMAIL_INTAKE_SECRET>`.
6. Body: Send `rawEmailSubject`, `rawEmailText`, `toEmail`, and the partner location fields.

New records appear in:

`Admin Portal -> Booking Queue`
