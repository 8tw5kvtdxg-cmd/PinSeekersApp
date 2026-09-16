export type VerifiedShot = { id: string; shotAt: Date | string; timestampReliable?: boolean | null };

export function deriveWinnerChronology(shots: VerifiedShot[]) {
  if (!shots.length) {
    return { status: "No Verified Result", provisionalReportId: null };
  }
  if (shots.some((shot) => shot.timestampReliable === false)) {
    return { status: "Chronology Review", provisionalReportId: null };
  }
  const sorted = [...shots].sort((a, b) =>
    new Date(a.shotAt).getTime() - new Date(b.shotAt).getTime() || a.id.localeCompare(b.id),
  );
  const firstAt = new Date(sorted[0].shotAt).getTime();
  if (!Number.isFinite(firstAt)) {
    return { status: "Chronology Review", provisionalReportId: null };
  }
  if (sorted.length > 1 && new Date(sorted[1].shotAt).getTime() === firstAt) {
    return { status: "Chronology Review", provisionalReportId: null };
  }
  return { status: "Provisional", provisionalReportId: sorted[0].id };
}
