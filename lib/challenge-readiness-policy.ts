export type ChallengeReadiness = {
    salesState: string;
    neverCloses?: boolean;
    e6EventCode: string | null;
    startsAt: Date | string | null;
    endsAt: Date | string | null;
    courseName: string | null;
    holeNumber: number | null;
    teeName: string | null;
    pinPosition: string | null;
    distanceYards: number | null;
    simulatorSettings: string | null;
    readinessReference: string | null;
    prizeFundingConfirmed: boolean;
    evidenceReady: boolean;
    rehearsalCompleted: boolean;
};
export function challengeConfigurationIssues(setting: ChallengeReadiness | null) {
    if (!setting)
        return ["Challenge setup has not been completed."];
    const issues: string[] = [];
    if (!setting.e6EventCode?.trim() || setting.e6EventCode === "E6-P2W-7429")
        issues.push("A real simulator event code is required.");
    const start = setting.startsAt ? new Date(setting.startsAt).getTime() : NaN;
    const end = setting.endsAt ? new Date(setting.endsAt).getTime() : NaN;
    if (!Number.isFinite(start) || (!setting.neverCloses && (!Number.isFinite(end) || end <= start)))
        issues.push("Valid opening and closing dates are required.");
    if (!setting.prizeFundingConfirmed)
        issues.push("Prize funding or insurance must be confirmed.");
    if (!setting.evidenceReady)
        issues.push("The simulator evidence and prize-review procedure must be ready.");
    if (!setting.rehearsalCompleted)
        issues.push("A completed supervised rehearsal is required.");
    return issues;
}
export function challengeSaleError(setting: ChallengeReadiness | null, now = new Date()) {
    if (!setting || !setting.e6EventCode?.trim() || setting.e6EventCode === "E6-P2W-7429")
        return "This challenge is not yet ready for purchases.";
    if (setting.salesState !== "Open")
        return "This challenge is paused or closed to new entries.";
    const startsAt = new Date(setting.startsAt ?? "").getTime();
    const endsAt = new Date(setting.endsAt ?? "").getTime();
    if (!Number.isFinite(startsAt) || (!setting.neverCloses && (!Number.isFinite(endsAt) || startsAt >= endsAt)))
        return "This challenge does not have a valid sales window.";
    if (now.getTime() < startsAt)
        return "This challenge has not opened yet.";
    if (!setting.neverCloses && now.getTime() >= endsAt)
        return "This challenge has ended.";
    return null;
}
