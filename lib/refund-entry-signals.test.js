import test from 'node:test';
import assert from 'node:assert/strict';
import { paidEntryReviewSignals } from './refund-entry-signals.ts';

const base = {
  checkoutStatus: 'Succeeded', refundStatus: 'None', entryArchived: false,
  eventCode: 'ABC123', accessRevealed: false, resultStatus: 'Pending E6 Result', salesState: 'Open',
};

test('paid archived or code-less entries are flagged for review, not refunded automatically', () => {
  assert.equal(paidEntryReviewSignals({ ...base, entryArchived: true }).archivedPaidEntry, true);
  assert.equal(paidEntryReviewSignals({ ...base, eventCode: '' }).missingEventCode, true);
});

test('challenge hold flags only unrevealed and unverified entries', () => {
  assert.equal(paidEntryReviewSignals({ ...base, salesState: 'Paused' }).challengeHoldMayAffectUnusedEntry, true);
  assert.equal(paidEntryReviewSignals({ ...base, salesState: 'Paused', accessRevealed: true }).challengeHoldMayAffectUnusedEntry, false);
  assert.equal(paidEntryReviewSignals({ ...base, salesState: 'Closed', resultStatus: 'Verified' }).challengeHoldMayAffectUnusedEntry, false);
});

test('pending or fully refunded payments do not spawn new review claims', () => {
  assert.deepEqual(paidEntryReviewSignals({ ...base, refundStatus: 'Refund Pending', entryArchived: true, eventCode: '' }), {
    archivedPaidEntry: false, missingEventCode: false, challengeHoldMayAffectUnusedEntry: false,
  });
});
