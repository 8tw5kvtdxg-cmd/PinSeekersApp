import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getSquareOrderPaymentIds,
  getSquarePaymentId,
  getSquarePaymentRefundedAmountCents,
  parseSquareRefund,
  refundSquarePayment,
  squareOrderLooksPaid,
  squarePaymentLooksPaid,
} from './square.ts';

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
});

test('parses and validates a Square refund webhook', () => {
  const payload = {
    type: 'refund.updated',
    data: {
      object: {
        refund: {
          id: 'refund-1',
          payment_id: 'payment-1',
          order_id: 'order-1',
          amount_money: { amount: 2000, currency: 'USD' },
          reason: 'Challenge closed',
          status: 'COMPLETED',
        },
      },
    },
  };

  assert.deepEqual(parseSquareRefund(payload), {
    id: 'refund-1',
    paymentId: 'payment-1',
    orderId: 'order-1',
    amountCents: 2000,
    currency: 'USD',
    reason: 'Challenge closed',
    status: 'COMPLETED',
  });
  assert.equal(parseSquareRefund({ refund: { status: 'COMPLETED' } }), null);
});

test('reads the amount Square already refunded from a payment', () => {
  assert.equal(
    getSquarePaymentRefundedAmountCents({
      payment: { refunded_money: { amount: 750, currency: 'USD' } },
    }),
    750,
  );
  assert.equal(getSquarePaymentRefundedAmountCents({ payment: {} }), 0);
});

test('issues an idempotent refund to the original Square payment', async () => {
  const originalFetch = globalThis.fetch;
  const originalToken = process.env.SQUARE_ACCESS_TOKEN;
  const originalEnvironment = process.env.SQUARE_ENVIRONMENT;
  let requestBody;

  process.env.SQUARE_ACCESS_TOKEN = 'sandbox-token';
  process.env.SQUARE_ENVIRONMENT = 'sandbox';
  globalThis.fetch = async (url, init) => {
    assert.equal(url, 'https://connect.squareupsandbox.com/v2/refunds');
    requestBody = JSON.parse(init.body);
    return new Response(
      JSON.stringify({
        refund: {
          id: 'refund-1',
          payment_id: 'payment-1',
          order_id: 'order-1',
          amount_money: { amount: 2000, currency: 'USD' },
          reason: 'Challenge closed',
          status: 'PENDING',
        },
      }),
      { status: 200 },
    );
  };

  try {
    const refund = await refundSquarePayment({
      amountCents: 2000,
      idempotencyKey: 'p2w-refund-stable-key',
      paymentId: 'payment-1',
      reason: 'Challenge closed',
    });

    assert.equal(refund.status, 'PENDING');
    assert.deepEqual(requestBody, {
      amount_money: { amount: 2000, currency: 'USD' },
      idempotency_key: 'p2w-refund-stable-key',
      payment_id: 'payment-1',
      reason: 'Challenge closed',
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalToken === undefined) delete process.env.SQUARE_ACCESS_TOKEN;
    else process.env.SQUARE_ACCESS_TOKEN = originalToken;
    if (originalEnvironment === undefined) delete process.env.SQUARE_ENVIRONMENT;
    else process.env.SQUARE_ENVIRONMENT = originalEnvironment;
  }
});
