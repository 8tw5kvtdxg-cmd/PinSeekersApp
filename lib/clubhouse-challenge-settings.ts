import { clubhouseChallenges, getClubhouseChallenge } from "@/lib/clubhouse";
import { Prisma } from "@/app/generated/prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import { challengeConfigurationIssues, type ChallengeReadiness } from "./challenge-readiness-policy.ts";
export type ClubhouseChallengeSettingView = Omit<ChallengeReadiness, "startsAt" | "endsAt" | "e6EventCode"> & {
    challengeSlug: string;
    e6EventCode: string;
    startsAt: string;
    endsAt: string;
    bayIds: string[];
};
const blank = {
    salesState: "Draft", e6EventCode: "", startsAt: "", endsAt: "", courseName: "", holeNumber: null,
    teeName: "", pinPosition: "", distanceYards: null, simulatorSettings: "", readinessReference: "",
    prizeFundingConfirmed: false, evidenceReady: false, rehearsalCompleted: false, bayIds: [] as string[],
};
export async function listClubhouseChallengeSettings(): Promise<ClubhouseChallengeSettingView[]> {
    const prisma = getPrismaClient();
    const saved = prisma ? await prisma.clubhouseChallengeSetting.findMany() : [];
    const assignments = prisma ? await prisma.clubhouseChallengeBay.findMany() : [];
    return clubhouseChallenges.map(challenge => {
        const setting = saved.find(s => s.challengeSlug === challenge.slug);
        return { ...blank, ...setting, challengeSlug: challenge.slug,
            e6EventCode: setting?.e6EventCode || "",
            startsAt: setting?.startsAt?.toISOString() || "", endsAt: setting?.endsAt?.toISOString() || "",
            bayIds: assignments.filter(a => a.challengeSlug === challenge.slug).map(a => a.bayId),
        };
    });
}
export async function getClubhouseChallengeSetting(slug: string) {
    const challenge = getClubhouseChallenge(slug);
    return challenge ? (await listClubhouseChallengeSettings()).find(s => s.challengeSlug === challenge.slug) || null : null;
}
export async function getClubhouseEventCode(slug: string) {
    const setting = await getClubhouseChallengeSetting(slug);
    return setting?.e6EventCode && setting.e6EventCode !== "E6-P2W-7429" ? setting.e6EventCode : null;
}
function text(value: unknown, limit = 500) { return typeof value === "string" ? value.trim().slice(0, limit) : ""; }
function date(value: unknown) {
    if (!value)
        return null;
    const raw = text(value);
    if (!/(Z|[+-]\d{2}:\d{2})$/.test(raw))
        throw new Error("Dates must include a time zone.");
    const parsed = new Date(raw);
    if (!Number.isFinite(parsed.getTime()))
        throw new Error("Invalid challenge date.");
    return parsed;
}
export async function updateClubhouseChallengeSetting(input: {
    challengeSlug: string;
    e6EventCode: unknown;
    startsAt: unknown;
    endsAt: unknown;
    configuration?: Record<string, unknown>;
    actorEmail: string;
}) {
    const challenge = getClubhouseChallenge(input.challengeSlug);
    const prisma = getPrismaClient();
    if (!challenge || !prisma)
        throw new Error("Challenge configuration is unavailable.");
    const c = input.configuration || {};
    const bayIds = Array.isArray(c.bayIds) ? [...new Set(c.bayIds.filter((v): v is string => typeof v === "string"))] : [];
    const data = {
        e6EventCode: text(input.e6EventCode, 100), startsAt: date(input.startsAt), endsAt: date(input.endsAt),
        salesState: text(c.salesState) || "Draft", courseName: text(c.courseName),
        holeNumber: c.holeNumber === null || c.holeNumber === "" ? null : Number(c.holeNumber),
        teeName: text(c.teeName), pinPosition: text(c.pinPosition),
        distanceYards: c.distanceYards === null || c.distanceYards === "" ? null : Number(c.distanceYards),
        simulatorSettings: text(c.simulatorSettings, 3000), readinessReference: text(c.readinessReference, 1000),
        prizeFundingConfirmed: c.prizeFundingConfirmed === true, evidenceReady: c.evidenceReady === true,
        rehearsalCompleted: c.rehearsalCompleted === true,
    };
    if (!['Draft', 'Open', 'Paused', 'Closed'].includes(data.salesState))
        throw new Error("Invalid sales state.");
    for (const key of ['holeNumber', 'distanceYards'] as const) {
        if (!Number.isInteger(data[key]))
            data[key] = null;
    }
    if (data.startsAt && data.endsAt && data.startsAt >= data.endsAt)
        throw new Error("End must be after start.");
    await prisma.$transaction(async (tx) => {
        const previous = await tx.clubhouseChallengeSetting.findUnique({ where: { challengeSlug: challenge.slug } });
        const reports = await tx.holeInOneReport.count({ where: { challengeSlug: challenge.slug, status: { in: ['Pending Review', 'Verified'] } } });
        const paid = previous?.startsAt && previous.endsAt ? await tx.squareCheckout.count({ where: { challengeSlug: challenge.slug, status: 'Succeeded', createdAt: { gte: previous.startsAt, lte: previous.endsAt } } }) : 0;
        const currentAssignments = await tx.clubhouseChallengeBay.findMany({ where: { challengeSlug: challenge.slug } });
        if (previous && (reports || paid)) {
            const material = ['e6EventCode', 'courseName', 'holeNumber', 'teeName', 'pinPosition', 'distanceYards', 'simulatorSettings', 'startsAt', 'endsAt'] as const;
            if (material.some(key => String(previous[key] ?? '') !== String(data[key] ?? '')) ||
                JSON.stringify(currentAssignments.map(a => a.bayId).sort()) !== JSON.stringify([...bayIds].sort())) {
                throw new Error("Paid entries or unresolved results exist. Material challenge details and bay assignments are locked.");
            }
        }
        if (reports && data.salesState === 'Open')
            throw new Error("Resolve potential/verified results before opening sales.");
        const activeBays = await tx.bay.count({ where: { id: { in: bayIds }, isActive: true, location: { isActive: true } } });
        if (activeBays !== bayIds.length)
            throw new Error("Select only active bays at active locations.");
        if (data.salesState === 'Open') {
            const issues = challengeConfigurationIssues(data);
            if (!bayIds.length)
                issues.push("Assign at least one approved bay.");
            if (data.endsAt && data.endsAt <= new Date())
                issues.push("The challenge closing date has passed.");
            if (issues.length)
                throw new Error(issues.join(' '));
        }
        await tx.clubhouseChallengeSetting.upsert({ where: { challengeSlug: challenge.slug },
            create: { challengeSlug: challenge.slug, ...data, approvedByEmail: input.actorEmail, approvedAt: new Date() },
            update: { ...data, approvedByEmail: input.actorEmail, approvedAt: new Date() },
        });
        await tx.clubhouseChallengeBay.deleteMany({ where: { challengeSlug: challenge.slug } });
        if (bayIds.length)
            await tx.clubhouseChallengeBay.createMany({ data: bayIds.map(bayId => ({ challengeSlug: challenge.slug, bayId })) });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return (await getClubhouseChallengeSetting(challenge.slug))!;
}
