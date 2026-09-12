export const activeChallengeStatus = "ACTIVE" as const;
export const pausedChallengeStatus = "PAUSED" as const;
export const closedChallengeStatus = "CLOSED" as const;

export type HoleInOneCandidate = {
  id: string;
  isHoleInOne?: boolean | null;
  resultStatus: string;
  resultOccurredAt?: Date | string | null;
};

function timestampOf(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();

  return Number.isFinite(timestamp) ? timestamp : null;
}

export function selectHoleInOneWinnerIds(
  candidates: HoleInOneCandidate[],
  chronologyUndeterminable = false,
) {
  const verified = candidates.filter(
    (candidate) =>
      candidate.isHoleInOne === true && candidate.resultStatus === "Verified",
  );

  if (verified.length === 0) {
    return [];
  }

  if (chronologyUndeterminable) {
    return verified.map((candidate) => candidate.id).sort();
  }

  const timestamped = verified
    .map((candidate) => ({
      id: candidate.id,
      timestamp: timestampOf(candidate.resultOccurredAt),
    }))
    .filter(
      (candidate): candidate is { id: string; timestamp: number } =>
        candidate.timestamp !== null,
    );

  if (timestamped.length !== verified.length) {
    throw new Error(
      "Winner chronology cannot be determined. Review the source timestamps and explicitly approve an equal split.",
    );
  }

  const earliestTimestamp = Math.min(
    ...timestamped.map((candidate) => candidate.timestamp),
  );

  return timestamped
    .filter((candidate) => candidate.timestamp === earliestTimestamp)
    .map((candidate) => candidate.id)
    .sort();
}

export function isChallengeCheckoutBlocked(status: string | null | undefined) {
  return status === pausedChallengeStatus || status === closedChallengeStatus;
}
