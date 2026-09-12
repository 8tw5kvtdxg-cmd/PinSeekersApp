import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getPlayerSessionExpiry,
  isPlayerSessionExpired,
  playerSessionDurationMs,
  shouldTouchPlayerSession,
} from './player-session-policy.ts';

test('player sessions expire exactly one hour after their last renewal', () => {
  const now = new Date('2026-09-11T12:00:00.000Z');
  const expiresAt = getPlayerSessionExpiry(now);

  assert.equal(expiresAt.getTime() - now.getTime(), playerSessionDurationMs);
  assert.equal(
    isPlayerSessionExpired(expiresAt, new Date(expiresAt.getTime() - 1)),
    false,
  );
  assert.equal(isPlayerSessionExpired(expiresAt, expiresAt), true);
});

test('session activity writes are throttled to five-minute intervals', () => {
  const lastActivityAt = new Date('2026-09-11T12:00:00.000Z');

  assert.equal(
    shouldTouchPlayerSession(
      lastActivityAt,
      new Date(lastActivityAt.getTime() + 5 * 60 * 1000 - 1),
    ),
    false,
  );
  assert.equal(
    shouldTouchPlayerSession(
      lastActivityAt,
      new Date(lastActivityAt.getTime() + 5 * 60 * 1000),
    ),
    true,
  );
});
