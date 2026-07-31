# Stripe Production Runbook

Use this when moving Pin2Win Stripe Checkout from test mode to live payments.

## Production environment variables

Set these in the production hosting environment:

```bash
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_APP_URL="https://your-production-domain.com"
```

`NEXT_PUBLIC_APP_URL` must be the public production origin with no path. The
checkout route uses it to build Stripe success and cancel URLs.

## Stripe Dashboard setup

1. Complete Stripe account activation so live payments and payouts are enabled.
2. Toggle the Stripe Dashboard to live mode.
3. Create or reveal the production server API key and store it as
   `STRIPE_SECRET_KEY`.
4. Add a live webhook endpoint:

   ```text
   https://your-production-domain.com/api/stripe/webhook
   ```

5. Subscribe the webhook endpoint to:

   ```text
   checkout.session.completed
   ```

6. Copy that endpoint's signing secret and store it as
   `STRIPE_WEBHOOK_SECRET`.

## Production smoke test

After deploying the production env vars:

1. Open the production site and start a paid challenge entry.
2. Confirm Stripe Checkout opens in live mode.
3. Complete a small real payment.
4. Confirm the user lands on `/checkout/success?session_id=...`.
5. Confirm the entry appears in the admin entry log.
6. In Stripe Dashboard, check the payment, API logs, and webhook delivery logs.

## Important storage note

Clubhouse entries are currently stored in `.pin2win-clubhouse-entries.json`.
That file is suitable only for a persistent single-server runtime. Before using
serverless, autoscaled, or ephemeral production hosting for real payments, move
paid entry persistence into the database so webhook-created entries are durable.
