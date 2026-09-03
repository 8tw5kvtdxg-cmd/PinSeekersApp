import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type TransactionAuditEvent = {
  id: string;
  checkoutId: string;
  provider: 'square' | 'payarc';
  event: string;
  status: 'Pending' | 'Succeeded' | 'Failed';
  createdAt: string;
  meta?: Record<string, string | number | boolean | null>;
};

export function getTransactionAuditStorePath() {
  return (
    process.env.PIN2WIN_TRANSACTION_AUDIT_PATH?.trim() ||
    path.join(
      /*turbopackIgnore: true*/ process.cwd(),
      '.pin2win-transaction-audit.json',
    )
  );
}

function hasFileStoreOverride() {
  return Boolean(process.env.PIN2WIN_TRANSACTION_AUDIT_PATH?.trim());
}

async function getAuditPrismaClient() {
  if (hasFileStoreOverride() || !process.env.DATABASE_URL) {
    return null;
  }

  const { getPrismaClient } = await import('./prisma.ts');

  return getPrismaClient();
}

function toAuditEvent(entry: {
  id: string;
  checkoutId: string;
  provider: string;
  event: string;
  status: string;
  createdAt: Date;
  meta: unknown;
}): TransactionAuditEvent {
  return {
    id: entry.id,
    checkoutId: entry.checkoutId,
    provider: entry.provider as TransactionAuditEvent['provider'],
    event: entry.event,
    status: entry.status as TransactionAuditEvent['status'],
    createdAt: entry.createdAt.toISOString(),
    meta:
      entry.meta && typeof entry.meta === 'object' && !Array.isArray(entry.meta)
        ? (entry.meta as TransactionAuditEvent['meta'])
        : undefined,
  };
}

async function readAuditStore() {
  const auditPath = getTransactionAuditStorePath();

  try {
    const file = await readFile(auditPath, 'utf8');
    const parsed = JSON.parse(file) as unknown;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {} as Record<string, TransactionAuditEvent[]>;
    }

    return parsed as Record<string, TransactionAuditEvent[]>;
  } catch {
    return {} as Record<string, TransactionAuditEvent[]>;
  }
}

async function writeAuditStore(store: Record<string, TransactionAuditEvent[]>) {
  const auditPath = getTransactionAuditStorePath();
  await writeFile(auditPath, `${JSON.stringify(store, null, 2)}\n`);
}

export async function appendTransactionAuditEvent(input: {
  checkoutId: string;
  provider: 'square' | 'payarc';
  event: string;
  status: 'Pending' | 'Succeeded' | 'Failed';
  meta?: Record<string, string | number | boolean | null>;
}) {
  const prisma = await getAuditPrismaClient();
  const id = randomUUID();
  const createdAt = new Date();

  if (prisma) {
    const entry = await prisma.transactionAuditEventRecord.create({
      data: {
        id,
        checkoutId: input.checkoutId,
        provider: input.provider,
        event: input.event,
        status: input.status,
        meta: input.meta,
        createdAt,
      },
    });

    return toAuditEvent(entry);
  }

  const store = await readAuditStore();
  const existing = store[input.checkoutId] ?? [];
  const entry: TransactionAuditEvent = {
    id,
    checkoutId: input.checkoutId,
    provider: input.provider,
    event: input.event,
    status: input.status,
    createdAt: createdAt.toISOString(),
    meta: input.meta,
  };

  store[input.checkoutId] = [...existing, entry];
  await writeAuditStore(store);

  return entry;
}

export async function recordTransactionAuditEvent(
  input: Parameters<typeof appendTransactionAuditEvent>[0],
) {
  try {
    return await appendTransactionAuditEvent(input);
  } catch (error) {
    console.error('Transaction audit event could not be recorded.', error);
    return null;
  }
}

export async function getCheckoutAuditTrail(checkoutId: string) {
  const prisma = await getAuditPrismaClient();

  if (prisma) {
    const entries = await prisma.transactionAuditEventRecord.findMany({
      orderBy: { createdAt: 'asc' },
      where: { checkoutId },
    });

    return entries.map(toAuditEvent);
  }

  const store = await readAuditStore();
  return (store[checkoutId] ?? []).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}
