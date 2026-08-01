import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type PayarcCheckoutStatus = "Pending" | "Succeeded" | "Failed";

export type PayarcCheckoutRecord = {
  id: string;
  playerEmail: string;
  challengeSlug: string;
  playerName: string;
  phoneNumber: string;
  e6DisplayName: string;
  locationSlug?: string;
  locationName?: string;
  bayName?: string;
  amountCents: number;
  status: PayarcCheckoutStatus;
  payarcOrderId: string;
  payarcOrderToken: string;
  paymentFormUrl: string;
  payarcChargeId?: string;
  entryId?: string;
  confirmationEmailSentAt?: string;
  createdAt: string;
  updatedAt: string;
};

const checkoutsPath = path.join(process.cwd(), ".pin2win-payarc-checkouts.json");

async function readJsonObject<T extends Record<string, unknown>>(
  filePath: string,
): Promise<T> {
  try {
    const file = await readFile(filePath, "utf8");
    const parsed = JSON.parse(file) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {} as T;
    }

    return parsed as T;
  } catch {
    return {} as T;
  }
}

async function writeJson(filePath: string, data: unknown) {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export function nextPayarcCheckoutId() {
  return `P2W-PAYARC-${randomUUID()}`;
}

export async function listPayarcCheckoutRecords() {
  const checkouts = await readJsonObject<Record<string, PayarcCheckoutRecord>>(
    checkoutsPath,
  );

  return Object.values(checkouts).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getPayarcCheckoutRecord(checkoutId: string) {
  const checkouts = await readJsonObject<Record<string, PayarcCheckoutRecord>>(
    checkoutsPath,
  );

  return checkouts[checkoutId] ?? null;
}

export async function createPayarcCheckoutRecord(
  input: Omit<PayarcCheckoutRecord, "status" | "createdAt" | "updatedAt">,
) {
  const checkouts = await readJsonObject<Record<string, PayarcCheckoutRecord>>(
    checkoutsPath,
  );
  const timestamp = new Date().toISOString();
  const checkout: PayarcCheckoutRecord = {
    ...input,
    status: "Pending",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  checkouts[checkout.id] = checkout;
  await writeJson(checkoutsPath, checkouts);

  return checkout;
}

export async function updatePayarcCheckoutRecord(
  checkoutId: string,
  patch: Partial<
    Pick<
      PayarcCheckoutRecord,
      | "status"
      | "payarcChargeId"
      | "entryId"
      | "confirmationEmailSentAt"
      | "updatedAt"
    >
  >,
) {
  const checkouts = await readJsonObject<Record<string, PayarcCheckoutRecord>>(
    checkoutsPath,
  );
  const checkout = checkouts[checkoutId];

  if (!checkout) {
    return null;
  }

  const updatedCheckout: PayarcCheckoutRecord = {
    ...checkout,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  checkouts[checkoutId] = updatedCheckout;
  await writeJson(checkoutsPath, checkouts);

  return updatedCheckout;
}
