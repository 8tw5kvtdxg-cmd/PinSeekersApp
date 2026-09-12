export const playerSessionDurationSeconds = 60 * 60;
export const playerSessionDurationMs = playerSessionDurationSeconds * 1000;
export const playerSessionTouchIntervalMs = 5 * 60 * 1000;

export function getPlayerSessionExpiry(now: Date) {
  return new Date(now.getTime() + playerSessionDurationMs);
}

export function isPlayerSessionExpired(expiresAt: Date, now: Date) {
  return expiresAt <= now;
}

export function shouldTouchPlayerSession(lastActivityAt: Date, now: Date) {
  return (
    now.getTime() - lastActivityAt.getTime() >= playerSessionTouchIntervalMs
  );
}
