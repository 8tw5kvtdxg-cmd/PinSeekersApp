# Square Payment Setup

Pin2Win now supports Square-hosted checkout for the onsite QR challenge entry flow.

## Square Dashboard Items Needed

Create or open a Square Developer application, then collect:

- Square access token
- Square location ID
- Square environment: `sandbox` or `production`

The Square account can still be POS-capable. For Pin2Win checkout, the important piece is having Square online/developer credentials that can create payment links for the selected business location.

## Vercel Environment Variables

Add these variables in Vercel:

```text
PAYMENT_PROVIDER=square
SQUARE_ENVIRONMENT=sandbox
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_LOCATION_ID=your_square_location_id
SQUARE_VERSION=2026-07-15
SQUARE_WEBHOOK_SIGNATURE_KEY=your_square_webhook_signature_key
```

For production processing, change:

```text
SQUARE_ENVIRONMENT=production
```

Use the production Square access token and production location ID when switching to live payments.

## Square Webhook

Add this webhook URL in the Square Developer Dashboard:

```text
https://pin2wingolf.com/api/square/webhook
```

Recommended events:

```text
payment.created
payment.updated
order.updated
```

The hosted checkout return page also attempts to verify the Square order directly, but the webhook gives Pin2Win a better server-to-server confirmation path.

## Customer Flow

1. Customer scans the onsite QR code.
2. Customer creates/logs into a verified Pin2Win account.
3. Customer enters player details.
4. Customer clicks pay and reveal event code.
5. Pin2Win creates a Square payment link.
6. Customer pays on Square-hosted checkout.
7. Square redirects customer back to Pin2Win.
8. Pin2Win verifies the payment, creates the challenge entry, sends confirmation email, and reveals the simulator event code.

## Local Testing

Use Square sandbox first. In local development, set the Square sandbox variables in `.env`, then run:

```text
npm run dev
```

Open the QR entry flow, create/login with a verified account, enter player details, and start checkout.
