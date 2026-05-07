import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  pin2WinPrisma?: PrismaClient;
};

export function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!globalForPrisma.pin2WinPrisma) {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });

    globalForPrisma.pin2WinPrisma = new PrismaClient({ adapter });
  }

  return globalForPrisma.pin2WinPrisma;
}
