import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getEventCodeRevealExpiry,
  isEventCodeRevealExpired,
  withoutEventCode,
} from './event-code-access.ts';

test('event code access expires exactly ten minutes after first reveal', () => {
  const revealedAt = '2026-09-04T15:00:00.000Z';

  assert.equal(
    getEventCodeRevealExpiry(revealedAt).toISOString(),
    '2026-09-04T15:10:00.000Z',
  );
  assert.equal(
    isEventCodeRevealExpired(revealedAt, new Date('2026-09-04T15:09:59.999Z')),
    false,
  );
  assert.equal(
    isEventCodeRevealExpired(revealedAt, new Date('2026-09-04T15:10:00.000Z')),
    true,
  );
});

test('protected player responses omit the event code entirely', () => {
  const entry = withoutEventCode({
    e6EventCode: 'SECRET-CODE',
    id: 'P2W-ENTRY-1',
  });

  assert.deepEqual(entry, { id: 'P2W-ENTRY-1' });
  assert.equal(JSON.stringify(entry).includes('SECRET-CODE'), false);
});
