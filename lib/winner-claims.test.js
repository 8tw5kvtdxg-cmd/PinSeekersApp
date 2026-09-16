import test from 'node:test';
import assert from 'node:assert/strict';
import { winnerResponseDueAt, prizePaymentTargetAt, potentialNoticeWeekdayTargetAt } from './winner-claim-policy.ts';

test('potential winner response deadline is ten calendar days from sent notice', () => {
  assert.equal(winnerResponseDueAt(new Date('2026-09-15T12:00:00Z')).toISOString(), '2026-09-25T12:00:00.000Z');
});

test('notice and payout targets are tracked separately from final adjudication', () => {
  assert.equal(potentialNoticeWeekdayTargetAt(new Date('2026-09-18T12:00:00Z')).toISOString(), '2026-09-25T12:00:00.000Z');
  assert.equal(prizePaymentTargetAt(new Date('2026-09-15T12:00:00Z')).toISOString(), '2026-10-15T12:00:00.000Z');
});
