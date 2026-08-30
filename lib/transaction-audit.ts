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

const auditPath = path.join(process.cwd(), '.pin2win-transaction-audit.json');

async function readAuditStore() {
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
  await writeFile(auditPath, `${JSON.stringify(store, null, 2)}\n`);
}

export async function appendTransactionAuditEvent(input: {
  checkoutId: string;
  provider: 'square' | 'payarc';
  event: string;
  status: 'Pending' | 'Succeeded' | 'Failed';
  meta?: Record<string, string | number | boolean | null>;
}) {
  const store = await readAuditStore();
  const existing = store[input.checkoutId] ?? [];
  const entry: TransactionAuditEvent = {
    id: randomUUID(),
    checkoutId: input.checkoutId,
    provider: input.provider,
    event: input.event,
    status: input.status,
    createdAt: new Date().toISOString(),
    meta: input.meta,
  };

  store[input.checkoutId] = [...existing, entry];
  await writeAuditStore(store);

  return entry;
}

export async function getCheckoutAuditTrail(checkoutId: string) {
  const store = await readAuditStore();
  return (store[checkoutId] ?? []).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}
