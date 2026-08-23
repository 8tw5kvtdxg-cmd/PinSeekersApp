import { getPrismaClient } from "@/lib/prisma";

export type OperatingCostRecord = {
  id: string;
  incurredAt: string;
  vendor: string;
  category: string;
  description: string;
  amountCents: number;
  paymentMethod: string;
  account: string;
  isDeductible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OperatingCostInput = {
  id?: string;
  incurredAt: string;
  vendor: string;
  category: string;
  description?: string;
  amountCents: number;
  paymentMethod?: string;
  account?: string;
  isDeductible: boolean;
};

const initialOperatingCosts: OperatingCostInput[] = [
  {
    incurredAt: "2026-05-20",
    vendor: "ChatGPTPro",
    category: "Software & Subscriptions",
    description: "AI software subscription",
    amountCents: 10640,
    paymentMethod: "Debit Card",
    account: "CJ Bank Account",
    isDeductible: true,
  },
  {
    incurredAt: "2026-06-20",
    vendor: "ChatGPTPro",
    category: "Software & Subscriptions",
    description: "AI software subscription",
    amountCents: 10640,
    paymentMethod: "Debit Card",
    account: "CJ Bank Account",
    isDeductible: true,
  },
  {
    incurredAt: "2026-07-17",
    vendor: "Bizee LLC Filing",
    category: "Legal & Filing Fees",
    description: "LLC filing",
    amountCents: 35000,
    paymentMethod: "Debit Card",
    account: "CJ Bank Account",
    isDeductible: true,
  },
  {
    incurredAt: "2026-07-20",
    vendor: "ChatGPTPro",
    category: "Software & Subscriptions",
    description: "AI software subscription",
    amountCents: 10640,
    paymentMethod: "Debit Card",
    account: "CJ Bank Account",
    isDeductible: true,
  },
  {
    incurredAt: "2026-07-22",
    vendor: "Bizee EIN Filing",
    category: "Legal & Filing Fees",
    description: "EIN filing",
    amountCents: 7000,
    paymentMethod: "Debit Card",
    account: "CJ Bank Account",
    isDeductible: true,
  },
];

function toDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (!Number.isFinite(date.getTime())) {
    throw new Error("A valid cost date is required.");
  }

  return date;
}

function toRecord(cost: {
  id: string;
  incurredAt: Date;
  vendor: string;
  category: string;
  description: string | null;
  amountCents: number;
  paymentMethod: string | null;
  account: string | null;
  isDeductible: boolean;
  createdAt: Date;
  updatedAt: Date;
}): OperatingCostRecord {
  return {
    id: cost.id,
    incurredAt: cost.incurredAt.toISOString(),
    vendor: cost.vendor,
    category: cost.category,
    description: cost.description ?? "",
    amountCents: cost.amountCents,
    paymentMethod: cost.paymentMethod ?? "",
    account: cost.account ?? "",
    isDeductible: cost.isDeductible,
    createdAt: cost.createdAt.toISOString(),
    updatedAt: cost.updatedAt.toISOString(),
  };
}

export async function seedInitialOperatingCostsIfNeeded() {
  const prisma = getPrismaClient();

  if (!prisma) {
    return;
  }

  const count = await prisma.operatingCost.count();

  if (count > 0) {
    return;
  }

  await prisma.operatingCost.createMany({
    data: initialOperatingCosts.map((cost) => ({
      incurredAt: toDate(cost.incurredAt),
      vendor: cost.vendor,
      category: cost.category,
      description: cost.description || null,
      amountCents: cost.amountCents,
      paymentMethod: cost.paymentMethod || null,
      account: cost.account || null,
      isDeductible: cost.isDeductible,
    })),
  });
}

export async function listOperatingCosts() {
  const prisma = getPrismaClient();

  if (!prisma) {
    return [];
  }

  await seedInitialOperatingCostsIfNeeded();

  const costs = await prisma.operatingCost.findMany({
    orderBy: [{ incurredAt: "desc" }, { createdAt: "desc" }],
  });

  return costs.map(toRecord);
}

export async function createOperatingCost(input: OperatingCostInput) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const cost = await prisma.operatingCost.create({
    data: {
      incurredAt: toDate(input.incurredAt),
      vendor: input.vendor,
      category: input.category,
      description: input.description || null,
      amountCents: input.amountCents,
      paymentMethod: input.paymentMethod || null,
      account: input.account || null,
      isDeductible: input.isDeductible,
    },
  });

  return toRecord(cost);
}

export async function updateOperatingCost(input: OperatingCostInput & { id: string }) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  const cost = await prisma.operatingCost.update({
    where: { id: input.id },
    data: {
      incurredAt: toDate(input.incurredAt),
      vendor: input.vendor,
      category: input.category,
      description: input.description || null,
      amountCents: input.amountCents,
      paymentMethod: input.paymentMethod || null,
      account: input.account || null,
      isDeductible: input.isDeductible,
    },
  });

  return toRecord(cost);
}

export async function deleteOperatingCost(id: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new Error("Database is not configured.");
  }

  await prisma.operatingCost.delete({ where: { id } });
}
