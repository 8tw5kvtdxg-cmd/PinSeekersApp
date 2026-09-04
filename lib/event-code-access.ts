export const EVENT_CODE_REVEAL_WINDOW_MS = 10 * 60 * 1000;

export function getEventCodeRevealExpiry(accessRevealedAt: string) {
  const revealedAt = new Date(accessRevealedAt);

  if (!Number.isFinite(revealedAt.getTime())) {
    throw new Error("Event code reveal time is invalid.");
  }

  return new Date(revealedAt.getTime() + EVENT_CODE_REVEAL_WINDOW_MS);
}

export function isEventCodeRevealExpired(
  accessRevealedAt: string,
  now = new Date(),
) {
  return now.getTime() >= getEventCodeRevealExpiry(accessRevealedAt).getTime();
}

export function withoutEventCode<T extends { e6EventCode?: unknown }>(record: T) {
  const protectedRecord = { ...record };

  delete protectedRecord.e6EventCode;

  return protectedRecord;
}
