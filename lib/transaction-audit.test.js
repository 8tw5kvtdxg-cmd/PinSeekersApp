import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import path from 'node:path';

import {
  appendTransactionAuditEvent,
  getCheckoutAuditTrail,
} from './transaction-audit.ts';

const originalAuditPath = process.env.PIN2WIN_TRANSACTION_AUDIT_PATH;
let currentAuditPath;

beforeEach(async () => {
  currentAuditPath = path.join(
    process.cwd(),
    `.pin2win-transaction-audit-${Date.now()}-${Math.random().toString(16).slice(2)}.json`,
  );

  process.env.PIN2WIN_TRANSACTION_AUDIT_PATH = currentAuditPath;
  await rm(currentAuditPath, { force: true });
});

afterEach(async () => {
  await rm(currentAuditPath, { force: true });
  currentAuditPath = undefined;

  if (originalAuditPath === undefined) {
    delete process.env.PIN2WIN_TRANSACTION_AUDIT_PATH;
    return;
  }

  process.env.PIN2WIN_TRANSACTION_AUDIT_PATH = originalAuditPath;
});

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
