import test from 'node:test';
import assert from 'node:assert/strict';

import {
  runLaunchFlowSmokeTest,
} from './live-flow-smoke.ts';

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
