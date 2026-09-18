export type ChallengeReadiness = {
    salesState: string;
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
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
        issues.push("Valid opening and closing dates are required.");
    if (!setting.courseName?.trim() || !setting.teeName?.trim() || !setting.pinPosition?.trim() || !setting.simulatorSettings?.trim())
        issues.push("Course, tee, pin, and simulator settings are required.");
    if (!Number.isInteger(setting.holeNumber) || setting.holeNumber! < 1 || setting.holeNumber! > 18)
        issues.push("A hole from 1 to 18 is required.");
    if (!Number.isInteger(setting.distanceYards) || setting.distanceYards! < 1 || setting.distanceYards! > 1000)
        issues.push("Target distance is required.");
    if (!setting.prizeFundingConfirmed)
        issues.push("Prize funding or insurance must be confirmed.");
    if (!setting.evidenceReady)
        issues.push("The simulator evidence and prize-review procedure must be ready.");
    if (!setting.rehearsalCompleted || !setting.readinessReference?.trim())
        issues.push("A completed supervised rehearsal and evidence reference are required.");
    return issues;
}
export function challengeSaleError(setting: ChallengeReadiness | null, now = new Date()) {
    if (challengeConfigurationIssues(setting).length)
        return "This challenge is not yet ready for purchases.";
    if (setting!.salesState !== "Open")
        return "This challenge is paused or closed to new entries.";
    if (now.getTime() < new Date(setting!.startsAt!).getTime())
        return "This challenge has not opened yet.";
    if (now.getTime() >= new Date(setting!.endsAt!).getTime())
        return "This challenge has ended.";
    return null;
}
