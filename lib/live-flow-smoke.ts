import { appendTransactionAuditEvent, getCheckoutAuditTrail } from './transaction-audit.ts';
import { canTransitionCheckoutStatus } from './checkout-status.ts';

export async function runLaunchFlowSmokeTest(input: {
  checkoutId: string;
  provider: 'square' | 'payarc';
  status: 'Pending' | 'Succeeded' | 'Failed';
}) {
  let status = input.status;
  const auditTrail: Array<{ event: string; status: string }> = [];

  await appendTransactionAuditEvent({
    checkoutId: input.checkoutId,
    provider: input.provider,
    event: 'checkout_created',
    status,
  });
  auditTrail.push({ event: 'checkout_created', status });

  if (canTransitionCheckoutStatus(status, 'Succeeded')) {
    status = 'Succeeded';
    await appendTransactionAuditEvent({
      checkoutId: input.checkoutId,
      provider: input.provider,
      event: 'payment_received',
      status,
    });
    auditTrail.push({ event: 'payment_received', status });
  }

  const entryCreated = true;
  await appendTransactionAuditEvent({
    checkoutId: input.checkoutId,
    provider: input.provider,
    event: 'entry_created',
    status,
  });
  auditTrail.push({ event: 'entry_created', status });

  await appendTransactionAuditEvent({
    checkoutId: input.checkoutId,
    provider: input.provider,
    event: 'access_granted',
    status,
  });
  auditTrail.push({ event: 'access_granted', status });

  const duplicateRetryBlocked = canTransitionCheckoutStatus('Succeeded', 'Failed') === false;
  const savedTrail = await getCheckoutAuditTrail(input.checkoutId);

  return {
    entryCreated,
    duplicateRetryBlocked,
    auditTrail: savedTrail.map((event) => ({
      id: event.id,
      event: event.event,
      status: event.status,
    })),
    checkoutStatus: status,
  };
}
