import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { sendPaymentConfirmationEmails } from './payment-confirmation-email.ts';

const originalFetch = global.fetch;
const originalEnvironment = {
  appUrl: process.env.PIN2WIN_APP_URL,
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.PIN2WIN_EMAIL_FROM,
  notificationEmail: process.env.PIN2WIN_PAYMENT_NOTIFICATION_EMAIL,
};

let requests;

beforeEach(() => {
  requests = [];
  process.env.PIN2WIN_APP_URL = 'https://pin2wingolf.example';
  process.env.RESEND_API_KEY = 'test-api-key';
  process.env.PIN2WIN_EMAIL_FROM = 'Pin2Win <noreply@pin2wingolf.example>';
  process.env.PIN2WIN_PAYMENT_NOTIFICATION_EMAIL = 'operations@pin2wingolf.example';
  global.fetch = async (_url, init) => {
    requests.push(init);
    return new Response(JSON.stringify({ id: `email-${requests.length}` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  };
});

afterEach(() => {
  global.fetch = originalFetch;

  for (const [name, value] of Object.entries({
    PIN2WIN_APP_URL: originalEnvironment.appUrl,
    RESEND_API_KEY: originalEnvironment.apiKey,
    PIN2WIN_EMAIL_FROM: originalEnvironment.from,
    PIN2WIN_PAYMENT_NOTIFICATION_EMAIL:
      originalEnvironment.notificationEmail,
  })) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
});

test('sends separate idempotent staff and player payment emails', async () => {
  const result = await sendPaymentConfirmationEmails({
    checkout: {
      id: 'checkout-123',
      playerEmail: 'player@example.com',
      challengeSlug: 'alamo-hole-in-one-challenge',
      playerName: 'Test Player',
      phoneNumber: '2105550100',
      e6DisplayName: 'TestPlayer',
      amountCents: 2000,
      status: 'Succeeded',
      squareOrderId: 'square-order-123',
      squarePaymentLinkUrl: 'https://square.example/checkout',
      createdAt: '2026-09-03T00:00:00.000Z',
      updatedAt: '2026-09-03T00:00:00.000Z',
    },
    entry: {
      id: 'P2W-ENTRY-20260903-0001',
      challengeSlug: 'alamo-hole-in-one-challenge',
      playerName: 'Test Player',
      playerEmail: 'player@example.com',
      phoneNumber: '2105550100',
      e6DisplayName: 'TestPlayer',
      paymentStatus: 'Succeeded',
      paidAt: 'September 3, 2026',
      validFrom: 'September 3, 2026',
      validUntil: 'September 3, 2026',
      attemptLimit: 1,
      resultStatus: 'Pending E6 Result',
      e6EventCode: 'TEST-CODE',
      squareCheckoutId: 'checkout-123',
      squareOrderId: 'square-order-123',
      paymentMethod: 'Square',
      locationSlug: 'alamo-golf-den',
      locationName: 'Alamo Golf Den',
      bayName: 'Bay 1',
      amountCents: 2000,
      createdAt: '2026-09-03T00:00:00.000Z',
      updatedAt: '2026-09-03T00:00:00.000Z',
    },
  });

  assert.equal(requests.length, 2);
  assert.equal(result?.staffEmailId, 'email-1');
  assert.equal(result?.playerEmailId, 'email-2');

  const staffRequest = requests[0];
  const staffBody = JSON.parse(staffRequest.body);
  assert.deepEqual(staffBody.to, ['operations@pin2wingolf.example']);
  assert.match(staffBody.subject, /^Payment received: \$20\.00/);
  assert.equal(
    staffRequest.headers['Idempotency-Key'],
    'payment-notification-staff/P2W-ENTRY-20260903-0001',
  );

  const playerRequest = requests[1];
  const playerBody = JSON.parse(playerRequest.body);
  assert.deepEqual(playerBody.to, ['player@example.com']);
  assert.match(playerBody.subject, /^Pin2Win entry confirmed/);
  assert.equal(
    playerRequest.headers['Idempotency-Key'],
    'payment-confirmation-player/P2W-ENTRY-20260903-0001',
  );
});
