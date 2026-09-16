import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveRefundState, isLateRefundClaim } from './refund-policy.ts';

test('14-day timing flag uses the later qualifying incident and never auto-denies', () => {
  const paidAt = new Date('2026-09-01T12:00:00Z');
  const incidentAt = new Date('2026-09-10T12:00:00Z');
  assert.equal(isLateRefundClaim(paidAt, incidentAt, new Date('2026-09-24T12:00:00Z')), false);
  assert.equal(isLateRefundClaim(paidAt, incidentAt, new Date('2026-09-24T12:00:01Z')), true);
});

test('partial refund keeps entry paid while a full refund revokes it', () => {
  assert.deepEqual(deriveRefundState({ providerStatus: 'COMPLETED', completedAmountCents: 500, checkoutAmountCents: 2000 }), {
    refundStatus: 'Partially Refunded', claimStatus: 'Partially Refunded', entryPaymentStatus: 'Succeeded',
  });
  assert.deepEqual(deriveRefundState({ providerStatus: 'COMPLETED', completedAmountCents: 2000, checkoutAmountCents: 2000 }), {
    refundStatus: 'Refunded', claimStatus: 'Refunded', entryPaymentStatus: 'Refunded',
  });
});

test('pending refund pauses entry access until Square resolves it', () => {
  assert.equal(deriveRefundState({ providerStatus: 'PENDING', completedAmountCents: 0, checkoutAmountCents: 2000 }).entryPaymentStatus, 'Refund Pending');
});
