import { getPrismaClient } from "@/lib/prisma";
import { challengeSaleError } from "./challenge-readiness-policy.ts";
export async function resolveChallengeCheckout(challengeSlug: string, locationSlug: string, bayName: string) {
    const prisma = getPrismaClient();
    if (!prisma)
        throw new Error("Challenge checkout is unavailable.");
    const setting = await prisma.clubhouseChallengeSetting.findUnique({ where: { challengeSlug } });
    const saleError = challengeSaleError(setting);
    if (saleError)
        throw new Error(saleError);
    if (!locationSlug || !bayName)
        throw new Error("Scan the approved QR code at your simulator bay before purchasing.");
    const bay = await prisma.bay.findFirst({
        where: { name: bayName, isActive: true, location: { slug: locationSlug, isActive: true }, clubhouseAssignments: { some: { challengeSlug } } },
        include: { location: true },
    });
    if (!bay)
        throw new Error("This venue and bay are not approved for this challenge.");
    return { setting: setting!, bay };
}
