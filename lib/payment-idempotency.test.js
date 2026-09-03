import test from 'node:test';
import assert from 'node:assert/strict';

import {
  findOrCreateCheckoutEntry,
  isUniqueConstraintError,
} from './payment-idempotency.ts';
import { canTransitionCheckoutStatus } from './checkout-status.ts';

test('returns existing entry when a duplicate create is retried', async () => {
  const existing = { id: 'entry-123' };
  let createCalls = 0;

  const result = await findOrCreateCheckoutEntry({
    findExisting: async () => null,
    createEntry: async () => {
      createCalls += 1;
      const error = new Error('duplicate key');
      error.code = 'P2002';
      throw error;
    },
    recoverExisting: async () => existing,
  });

  assert.equal(result, existing);
  assert.equal(createCalls, 1);
});

test('rethrows non-duplicate database errors', async () => {
  const error = new Error('database unavailable');
  error.code = 'P2024';

  await assert.rejects(
    () =>
      findOrCreateCheckoutEntry({
        findExisting: async () => null,
        createEntry: async () => {
          throw error;
        },
        recoverExisting: async () => null,
      }),
    /database unavailable/
  );
});

test('detects unique constraint errors from Prisma', () => {
  const error = new Error('Unique constraint failed');
  error.code = 'P2002';

  assert.equal(isUniqueConstraintError(error), true);
  assert.equal(isUniqueConstraintError(new Error('other')), false);
});

test('does not allow a terminal checkout state to be overwritten', () => {
  assert.equal(canTransitionCheckoutStatus('Succeeded', 'Failed'), false);
  assert.equal(canTransitionCheckoutStatus('Failed', 'Succeeded'), false);
  assert.equal(canTransitionCheckoutStatus('Pending', 'Succeeded'), true);
  assert.equal(canTransitionCheckoutStatus('Pending', 'Pending'), true);
});
