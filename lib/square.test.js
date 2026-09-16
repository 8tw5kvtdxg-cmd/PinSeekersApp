import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createSquarePaymentRefund,
  getSquarePaymentRefund,
  getSquareOrderPaymentIds,
  getSquarePaymentId,
  getSquarePaymentCreatedAt,
  squareOrderLooksPaid,
  squarePaymentLooksPaid,
} from './square.ts';

test('Square refund request uses a stable idempotency key and verified linked payment', async () => {
  const previousFetch = globalThis.fetch;
  const previousToken = process.env.SQUARE_ACCESS_TOKEN;
  process.env.SQUARE_ACCESS_TOKEN = 'test-token';
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify({ refund: { id: 'refund-1', status: 'PENDING', payment_id: 'payment-1', amount_money: { amount: 2000, currency: 'USD' } } }), { status: 200 });
  };
  try {
    const refund = await createSquarePaymentRefund({
      paymentId: 'payment-1', amountCents: 2000,
      idempotencyKey: 'stable-key', reason: 'Paid entry was not delivered.',
    });
    assert.deepEqual(refund, { id: 'refund-1', status: 'PENDING' });
    assert.match(String(calls[0].url), /\/v2\/refunds$/);
    assert.equal(calls[0].options.method, 'POST');
    assert.deepEqual(JSON.parse(calls[0].options.body), {
      idempotency_key: 'stable-key', payment_id: 'payment-1',
      amount_money: { amount: 2000, currency: 'USD' }, reason: 'Paid entry was not delivered.',
    });
  } finally {
    globalThis.fetch = previousFetch;
    if (previousToken === undefined) delete process.env.SQUARE_ACCESS_TOKEN;
    else process.env.SQUARE_ACCESS_TOKEN = previousToken;
  }
});

test('Square refund status must be retrieved from the provider', async () => {
  const previousFetch = globalThis.fetch;
  const previousToken = process.env.SQUARE_ACCESS_TOKEN;
  process.env.SQUARE_ACCESS_TOKEN = 'test-token';
  globalThis.fetch = async () => new Response(JSON.stringify({ refund: { id: 'refund-1', status: 'COMPLETED', payment_id: 'payment-1', amount_money: { amount: 2000, currency: 'USD' } } }), { status: 200 });
  try {
    assert.deepEqual(await getSquarePaymentRefund({ refundId: 'refund-1', paymentId: 'payment-1', amountCents: 2000 }), { id: 'refund-1', status: 'COMPLETED' });
  } finally {
    globalThis.fetch = previousFetch;
    if (previousToken === undefined) delete process.env.SQUARE_ACCESS_TOKEN;
    else process.env.SQUARE_ACCESS_TOKEN = previousToken;
  }
});

test('does not accept an open Square order merely because it has a tender', () => {
  assert.equal(
    squareOrderLooksPaid(
      { order: { state: 'COMPLETED', total_money: { amount: 2000 } } },
      2000,
    ),
    true,
  );
  assert.equal(
    squareOrderLooksPaid(
      { order: { state: 'OPEN', total_money: { amount: 2000 }, tenders: [{}] } },
      2000,
    ),
    false,
  );
  assert.equal(
    squareOrderLooksPaid(
      { order: { state: 'COMPLETED', total_money: { amount: 1000 } } },
      2000,
    ),
    false,
  );
  assert.equal(
    squareOrderLooksPaid({ status: 'COMPLETED' }, 2000),
    false,
  );
});

test('accepts a paid Payment Link order that remains open with no amount due', () => {
  assert.equal(
    squareOrderLooksPaid(
      {
        order: {
          state: 'OPEN',
          total_money: { amount: 2000, currency: 'USD' },
          net_amount_due_money: { amount: 0, currency: 'USD' },
        },
      },
      2000,
    ),
    true,
  );

  assert.equal(
    squareOrderLooksPaid(
      {
        order: {
          state: 'OPEN',
          total_money: { amount: 2000, currency: 'USD' },
          net_amount_due_money: { amount: 2000, currency: 'USD' },
        },
      },
      2000,
    ),
    false,
  );
});

test('extracts payment IDs from Square order tenders', () => {
  assert.deepEqual(
    getSquareOrderPaymentIds({
      order: {
        tenders: [
          { payment_id: 'payment-1' },
          { id: 'payment-2' },
          { payment_id: 'payment-1' },
        ],
      },
    }),
    ['payment-1', 'payment-2'],
  );
});

test('requires a completed Square payment for the exact order and amount', () => {
  const payment = {
    payment: {
      amount_money: { amount: 2000, currency: 'USD' },
      order_id: 'order-1',
      status: 'COMPLETED',
    },
  };

  assert.equal(
    squarePaymentLooksPaid(payment, { amountCents: 2000, orderId: 'order-1' }),
    true,
  );
  assert.equal(
    squarePaymentLooksPaid(payment, { amountCents: 2100, orderId: 'order-1' }),
    false,
  );
  assert.equal(
    squarePaymentLooksPaid(payment, { amountCents: 2000, orderId: 'order-2' }),
    false,
  );
});

test('validates and identifies a completed payment.updated webhook', () => {
  const payload = {
    data: {
      object: {
        payment: {
          id: 'payment-1',
          created_at: '2026-09-10T12:00:00Z',
          amount_money: { amount: 2000, currency: 'USD' },
          order_id: 'order-1',
          status: 'COMPLETED',
        },
      },
    },
    event_id: 'event-1',
    type: 'payment.updated',
  };

  assert.equal(
    squarePaymentLooksPaid(payload, { amountCents: 2000, orderId: 'order-1' }),
    true,
  );
  assert.equal(getSquarePaymentId(payload), 'payment-1');
  assert.equal(getSquarePaymentCreatedAt(payload), '2026-09-10T12:00:00.000Z');
  assert.equal(getSquarePaymentCreatedAt({ payment: { created_at: 'invalid' } }), '');
});
