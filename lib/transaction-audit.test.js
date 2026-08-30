import test from 'node:test';
import assert from 'node:assert/strict';

import {
  appendTransactionAuditEvent,
  getCheckoutAuditTrail,
} from './transaction-audit.ts';

test('records the checkout lifecycle in order', async () => {
  const checkoutId = 'audit-checkout-001';

  await appendTransactionAuditEvent({
    checkoutId,
    provider: 'square',
    event: 'checkout_created',
    status: 'Pending',
  });

  await appendTransactionAuditEvent({
    checkoutId,
    provider: 'square',
    event: 'payment_received',
    status: 'Succeeded',
  });

  const trail = await getCheckoutAuditTrail(checkoutId);

  assert.equal(trail.length, 2);
  assert.deepEqual(
    trail.map((entry) => entry.event),
    ['checkout_created', 'payment_received']
  );
});

test('keeps each checkout isolated from other transactions', async () => {
  const firstCheckoutId = 'audit-checkout-010';
  const secondCheckoutId = 'audit-checkout-011';

  await appendTransactionAuditEvent({
    checkoutId: firstCheckoutId,
    provider: 'square',
    event: 'checkout_created',
    status: 'Pending',
  });

  await appendTransactionAuditEvent({
    checkoutId: secondCheckoutId,
    provider: 'square',
    event: 'checkout_created',
    status: 'Pending',
  });

  const firstTrail = await getCheckoutAuditTrail(firstCheckoutId);
  const secondTrail = await getCheckoutAuditTrail(secondCheckoutId);

  assert.equal(firstTrail.length, 1);
  assert.equal(secondTrail.length, 1);
  assert.notEqual(firstTrail[0].id, secondTrail[0].id);
});
