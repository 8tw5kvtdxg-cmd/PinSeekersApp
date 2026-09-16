import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveWinnerChronology } from './winner-chronology-policy.ts';

test('uses shot time rather than report or review order for provisional priority', () => {
  assert.deepEqual(deriveWinnerChronology([
    { id: 'reported-first', shotAt: '2026-09-15T18:00:00.000Z' },
    { id: 'reported-later', shotAt: '2026-09-15T17:59:00.000Z' },
  ]), { status: 'Provisional', provisionalReportId: 'reported-later' });
});

test('holds equal earliest simulator timestamps for chronology review', () => {
  assert.deepEqual(deriveWinnerChronology([
    { id: 'a', shotAt: '2026-09-15T18:00:00.000Z' },
    { id: 'b', shotAt: '2026-09-15T18:00:00.000Z' },
    { id: 'c', shotAt: '2026-09-15T18:05:00.000Z' },
  ]), { status: 'Chronology Review', provisionalReportId: null });
});

test('does not select a provisional leader when a verified shot time is unreliable', () => {
  assert.deepEqual(deriveWinnerChronology([
    { id: 'a', shotAt: '2026-09-15T17:59:00.000Z', timestampReliable: false },
    { id: 'b', shotAt: '2026-09-15T18:00:00.000Z', timestampReliable: true },
  ]), { status: 'Chronology Review', provisionalReportId: null });
});
