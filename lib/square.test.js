import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getSquareOrderPaymentIds,
  getSquarePaymentId,
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
