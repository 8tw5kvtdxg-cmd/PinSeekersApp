import { getPrismaClient } from "@/lib/prisma";
export type PartnerLocationSummary = {
    id: string;
    name: string;
    slug: string;
    bookingUrl: string | null;
    websiteUrl: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    isActive: boolean;
};
export async function listPartnerLocations(): Promise<PartnerLocationSummary[]> {
    const prisma = getPrismaClient();
    return prisma ? prisma.location.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, slug: true, bookingUrl: true, websiteUrl: true, address: true, city: true, state: true, isActive: true } }) : [];
}
export async function getPartnerLocation(slug: string) {
    const prisma = getPrismaClient();
    return prisma ? prisma.location.findFirst({ where: { slug, isActive: true } }) : null;
}
