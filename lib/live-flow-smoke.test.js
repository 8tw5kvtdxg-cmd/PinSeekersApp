import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import path from 'node:path';

import {
  runLaunchFlowSmokeTest,
} from './live-flow-smoke.ts';

const originalAuditPath = process.env.PIN2WIN_TRANSACTION_AUDIT_PATH;
let currentAuditPath;

beforeEach(async () => {
  currentAuditPath = path.join(
    process.cwd(),
    `.pin2win-transaction-audit-${Date.now()}-${Math.random().toString(16).slice(2)}.json`,
  );

  process.env.PIN2WIN_TRANSACTION_AUDIT_PATH = currentAuditPath;
  await rm(currentAuditPath, { force: true });
});

afterEach(async () => {
  await rm(currentAuditPath, { force: true });
  currentAuditPath = undefined;

  if (originalAuditPath === undefined) {
    delete process.env.PIN2WIN_TRANSACTION_AUDIT_PATH;
    return;
  }

  process.env.PIN2WIN_TRANSACTION_AUDIT_PATH = originalAuditPath;
});

test('critical launch flow stays idempotent and auditable', async () => {
  const result = await runLaunchFlowSmokeTest({
    checkoutId: 'launch-flow-001',
    provider: 'square',
    status: 'Pending',
  });

  assert.equal(result.entryCreated, true);
  assert.equal(result.duplicateRetryBlocked, true);
  assert.equal(result.auditTrail.length, 4);
  assert.deepEqual(
    result.auditTrail.map((event) => event.event),
    ['checkout_created', 'payment_received', 'entry_created', 'access_granted']
  );
  assert.equal(result.checkoutStatus, 'Succeeded');
});
