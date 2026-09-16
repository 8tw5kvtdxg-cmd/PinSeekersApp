import { createHash } from "node:crypto";
import {
  createClubhouseEntryRecord,
  getClubhouseEntryRecordBySquareCheckoutId,
} from "@/lib/clubhouse-entry-store";
import { getAppBaseUrl } from "@/lib/app-url";
import { findOrCreateCheckoutEntry } from "@/lib/payment-idempotency";
import { sendPaymentConfirmationEmails } from "@/lib/payment-confirmation-email";
import { getPrismaClient } from "@/lib/prisma";
import { getSquareCheckoutRecord, updateSquareCheckoutRecord } from "@/lib/square-checkout-store";
import { verifySquareOrderPayment } from "@/lib/square";
import { activeParticipationHoldByEmail } from "@/lib/participation-holds";
import { recordTransactionAuditEvent } from "@/lib/transaction-audit";
import { getPin2WinNotificationEmails } from "@/lib/notification-email-recipients";
import { flagConfirmedPaymentWithoutEntry, flagSystemPaymentIssue, resolveRecoveredPaymentIssue, resolveSystemPaymentIssue } from "@/lib/refund-claims";
import { paidEntryReviewSignals } from "@/lib/refund-entry-signals";

const batchSize = 20;

function requiredPrisma() {
  const prisma = getPrismaClient();
  if (!prisma) throw new Error("Database is required for payment reconciliation.");
  return prisma;
}

async function openIssue(input: {
  key: string;
  type: string;
  checkoutId?: string;
  entryId?: string;
  detail: string;
  customerEmail?: string;
}) {
  const prisma = requiredPrisma();
  await prisma.paymentReconciliationIssue.upsert({
    where: { key: input.key },
    create: { ...input, status: "Open" },
    update: { detail: input.detail, status: "Open", resolvedAt: null,
      customerEmail: input.customerEmail || undefined,
    },
  });
}

async function resolveIssue(key: string) {
  await requiredPrisma().paymentReconciliationIssue.updateMany({
    where: { key, status: "Open" },
    data: { status: "Resolved", resolvedAt: new Date() },
  });
}

async function retryConfirmationEmail(checkoutId: string, entryId: string) {
  const checkout = await getSquareCheckoutRecord(checkoutId);
  const entry = await getClubhouseEntryRecordBySquareCheckoutId(checkoutId);
  if (!checkout || !entry || entry.id !== entryId || checkout.confirmationEmailSentAt) return;

  try {
    await sendPaymentConfirmationEmails({
      checkout, entry,
      eligibilityHeld: await activeParticipationHoldByEmail(checkout.playerEmail),
      onAudienceSent: async (audience) => {
        await updateSquareCheckoutRecord(checkoutId, {
          [audience === "staff" ? "staffEmailSentAt" : "playerEmailSentAt"]: new Date().toISOString(),
        });
      },
    });
    await updateSquareCheckoutRecord(checkoutId, {
      confirmationEmailSentAt: new Date().toISOString(),
    });
    await recordTransactionAuditEvent({
      checkoutId, provider: "square", event: "confirmation_emails_sent",
      status: "Succeeded", meta: { entryId },
    });
    await resolveIssue(`email:${checkoutId}`);
  } catch {
    await recordTransactionAuditEvent({
      checkoutId, provider: "square", event: "confirmation_emails_failed",
      status: "Failed", meta: { entryId },
    });
    await openIssue({
      key: `email:${checkoutId}`, type: "Confirmation email retry",
      checkoutId, entryId,
      customerEmail: checkout.playerEmail,
      detail: "Payment and entry are confirmed, but confirmation email delivery is unresolved.",
    });
  }
}

async function inspectConfirmedCheckoutAccess(checkoutId: string) {
  const prisma = requiredPrisma();
  const [checkout, entry] = await Promise.all([
    prisma.squareCheckout.findUnique({ where: { id: checkoutId } }),
    prisma.clubhouseEntryRecord.findUnique({ where: { squareCheckoutId: checkoutId } }),
  ]);
  if (!checkout || !entry || checkout.status !== "Succeeded" || ["Refund Requested", "Refund Pending", "Refunded"].includes(checkout.refundStatus)) return;
  const setting = await prisma.clubhouseChallengeSetting.findUnique({ where: { challengeSlug: checkout.challengeSlug }, select: { salesState: true } });
  const signals = paidEntryReviewSignals({
    checkoutStatus: checkout.status, refundStatus: checkout.refundStatus,
    entryArchived: Boolean(entry.archivedAt), eventCode: entry.e6EventCode,
    accessRevealed: Boolean(checkout.accessRevealedAt), resultStatus: entry.resultStatus,
    salesState: setting?.salesState || "Open",
  });
  if (signals.archivedPaidEntry) {
    await flagSystemPaymentIssue({ checkoutId, entryId: entry.id, issueCode: "archived-paid-entry", reason: "Other payment issue",
      narrative: "A successful Square checkout is linked to an archived entry. Administrator review is needed to determine access and any remedy; no refund is automatic.",
      action: "Paid entry unavailable for review",
    });
  } else await resolveSystemPaymentIssue(checkoutId, "archived-paid-entry", "Entry archive signal is no longer present; contact support if access still failed.");
  if (signals.missingEventCode) {
    await flagSystemPaymentIssue({ checkoutId, entryId: entry.id, issueCode: "missing-event-code", reason: "Access not delivered",
      narrative: "A paid entry has no usable simulator event code in its record. Administrator review is required; no refund is automatic.",
      action: "Event code unavailable for paid entry",
    });
  } else await resolveSystemPaymentIssue(checkoutId, "missing-event-code", "The event-code signal is no longer present; contact support if access still failed.");
  if (signals.challengeHoldMayAffectUnusedEntry) {
    await flagSystemPaymentIssue({ checkoutId, entryId: entry.id, issueCode: "challenge-hold-unused", reason: "Other payment issue",
      narrative: "The challenge is held or closed and this paid entry has no recorded event-code reveal. Review venue/simulator attempt logs before deciding whether an unused-entry remedy is due.",
      action: "Challenge hold may affect unused paid entry",
    });
  } else await resolveSystemPaymentIssue(checkoutId, "challenge-hold-unused", "The challenge-hold signal no longer applies; contact support if access still failed.");
}

async function reconcileCheckout(checkoutId: string) {
  const prisma = requiredPrisma();
  const checkout = await getSquareCheckoutRecord(checkoutId);
  if (!checkout) return;

  if (["Refund Requested", "Refund Pending", "Refunded"].includes(checkout.refundStatus ?? "")) {
    await prisma.squareCheckout.update({ where: { id: checkoutId }, data: { reconciledAt: new Date() } });
    return;
  }

  try {
    const existingEntry = await getClubhouseEntryRecordBySquareCheckoutId(checkoutId);
    const verification = await verifySquareOrderPayment({
      orderId: checkout.squareOrderId, amountCents: checkout.amountCents,
    });

    if (!verification.isPaid) {
      if (existingEntry || checkout.status === "Succeeded") {
        await openIssue({
          key: `unpaid:${checkoutId}`, type: "Entry/payment mismatch",
          checkoutId, entryId: existingEntry?.id,
          customerEmail: checkout.playerEmail,
          detail: "Square did not verify the recorded payment. Review before allowing further access.",
        });
      } else {
        await resolveIssue(`unpaid:${checkoutId}`);
      }
      return;
    }

    await resolveIssue(`unpaid:${checkoutId}`);
    // Independently verified Square payment may recover a checkout previously marked Failed.
    await prisma.squareCheckout.update({
      where: { id: checkoutId },
      data: {
        status: "Succeeded", squarePaymentId: verification.paymentId || checkout.squarePaymentId,
        squarePaidAt: checkout.squarePaidAt ? undefined : verification.paymentCreatedAt ? new Date(verification.paymentCreatedAt) : undefined,
      },
    });
    if (checkout.status !== "Succeeded") {
      await recordTransactionAuditEvent({
        checkoutId, provider: "square", event: "payment_reconciled",
        status: "Succeeded", meta: { squareOrderId: checkout.squareOrderId },
      });
    }

    const entry = await findOrCreateCheckoutEntry({
      findExisting: async () => existingEntry,
      createEntry: async () => {
        const created = await createClubhouseEntryRecord({
          challengeSlug: checkout.challengeSlug,
          playerName: checkout.playerName,
          playerEmail: checkout.playerEmail,
          phoneNumber: checkout.phoneNumber,
          e6DisplayName: checkout.e6DisplayName,
          squareCheckoutId: checkout.id,
          squareOrderId: checkout.squareOrderId,
          squarePaymentId: verification.paymentId || checkout.squarePaymentId,
          acceptedConsentRecordId: checkout.acceptedConsentRecordId,
          acceptedDocumentVersion: checkout.acceptedDocumentVersion,
          acceptedPackageHash: checkout.acceptedPackageHash,
          venueBookingReference: `Square order ${checkout.squareOrderId}`,
          locationSlug: checkout.locationSlug,
          locationName: checkout.locationName,
          bayName: checkout.bayName,
        });
        await recordTransactionAuditEvent({
          checkoutId, provider: "square", event: "entry_reconciled",
          status: "Succeeded", meta: { entryId: created.id },
        });
        return created;
      },
      recoverExisting: async () => getClubhouseEntryRecordBySquareCheckoutId(checkoutId),
    });
    if (checkout.entryId !== entry.id) {
      await updateSquareCheckoutRecord(checkoutId, { entryId: entry.id });
    }
    await resolveIssue(`missing-entry:${checkoutId}`);
    await resolveRecoveredPaymentIssue(checkoutId);
    await retryConfirmationEmail(checkoutId, entry.id);
    try { await inspectConfirmedCheckoutAccess(checkoutId); await resolveIssue(`entry-access:${checkoutId}`); }
    catch (accessError) {
      console.error("Paid-entry access inspection failed.", checkoutId, accessError);
      await openIssue({
        key: `entry-access:${checkoutId}`, type: "Paid-entry access inspection failed",
        checkoutId, entryId: entry.id,
        detail: "The paid entry exists, but automated access/hold signals could not be evaluated; review manually.",
      });
    }
  } catch (error) {
    console.error("Square checkout reconciliation failed.", checkoutId, error);
    await openIssue({
      key: `missing-entry:${checkoutId}`, type: "Checkout reconciliation failed",
      checkoutId,
      detail: "Square checkout could not be verified or finalized; inspect provider and application logs.",
    });
    try { await flagConfirmedPaymentWithoutEntry(checkoutId); }
    catch (flagError) { console.error("Paid-without-entry claim could not be recorded.", checkoutId, flagError); }
  } finally {
    await prisma.squareCheckout.update({
      where: { id: checkoutId }, data: { reconciledAt: new Date() },
    });
  }
}

async function reconcileEntry(entryId: string) {
  const prisma = requiredPrisma();
  const entry = await prisma.clubhouseEntryRecord.findUnique({ where: { id: entryId } });
  if (!entry || entry.paymentMethod !== "Square") return;

  try {
    const checkout = entry.squareCheckoutId
      ? await prisma.squareCheckout.findUnique({ where: { id: entry.squareCheckoutId } })
      : null;
    const issueKey = `orphan-entry:${entryId}`;
    if (!checkout || checkout.squareOrderId !== entry.squareOrderId || checkout.amountCents !== entry.amountCents) {
      await openIssue({
        key: issueKey, type: "Entry without matching checkout", entryId,
        checkoutId: entry.squareCheckoutId ?? undefined,
        customerEmail: entry.playerEmail ?? undefined,
        detail: "Square entry has no checkout with matching order and amount.",
      });
    } else {
      await resolveIssue(issueKey);
      // The checkout scan independently re-verifies the Square payment.
    }
  } finally {
    await prisma.clubhouseEntryRecord.update({
      where: { id: entryId }, data: { paymentReconciledAt: new Date() },
    });
  }
}

async function alertAdministrators() {
  const prisma = requiredPrisma();
  const issues = await prisma.paymentReconciliationIssue.findMany({
    where: { status: "Open", lastAlertedAt: null },
    orderBy: { createdAt: "asc" }, take: 20,
  });
  if (!issues.length) return 0;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PIN2WIN_EMAIL_FROM;
  if (!apiKey || !from) return 0;
  const alertKey = createHash("sha256")
    .update(issues.map((issue) => issue.key).sort().join("\n"))
    .digest("hex");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `payment-reconciliation-alert/${alertKey}`,
    },
    body: JSON.stringify({
      from, to: getPin2WinNotificationEmails(),
      subject: `Pin2Win payment reconciliation: ${issues.length} unresolved issue(s)`,
      text: [
        `${issues.length} payment reconciliation issue(s) require review.`,
        `${getAppBaseUrl()}/admin/reconciliation`,
        "",
        ...issues.map((issue) => `${issue.type}: ${issue.checkoutId ?? issue.entryId ?? issue.key} — ${issue.detail}`),
      ].join("\n"),
    }),
  });
  if (!response.ok) throw new Error(`Reconciliation alert delivery failed (${response.status}).`);
  await prisma.paymentReconciliationIssue.updateMany({
    where: { key: { in: issues.map((issue) => issue.key) }, lastAlertedAt: null },
    data: { lastAlertedAt: new Date() },
  });
  return issues.length;
}

async function notifyCustomersOfReconciliationIssues() {
  const prisma = requiredPrisma();
  const issues = await prisma.paymentReconciliationIssue.findMany({
    where: { status: "Open", customerEmail: { not: null }, customerNotifiedAt: null,
      createdAt: { lt: new Date(Date.now() - 60 * 60 * 1000) },
      type: { in: ["Confirmation email retry", "Entry without matching checkout", "Entry/payment mismatch"] },
    },
    orderBy: { createdAt: "asc" }, take: 20,
  });
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PIN2WIN_EMAIL_FROM;
  if (!apiKey || !from) return 0;
  let sent = 0;
  for (const issue of issues) {
    const email = issue.customerEmail?.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
    const accessUrl = issue.checkoutId ? `${getAppBaseUrl()}/checkout/access?checkoutId=${encodeURIComponent(issue.checkoutId)}` : "";
    const text = issue.type === "Confirmation email retry"
      ? `Your Pin2Win payment and entry are confirmed, but an access email has not been delivered. You can sign in and open your access page directly: ${accessUrl}\n\nWe are retrying email delivery. Contact pin2wingolf@outlook.com if you need help.`
      : `A Pin2Win entry/payment record for ${issue.entryId || issue.checkoutId || "your account"} needs verification. Please do not pay a second time for the same intended entry until support confirms the first payment. Contact pin2wingolf@outlook.com or submit a payment issue at ${getAppBaseUrl()}/account/payment-issue.`;
    const key = createHash("sha256").update(issue.key).digest("hex");
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `reconciliation-customer-${key}` },
        body: JSON.stringify({ from, to: [email], subject: "Pin2Win payment or entry status needs attention", text }),
      });
      if (!response.ok) throw new Error(`Customer reconciliation notice failed (${response.status}).`);
      await prisma.paymentReconciliationIssue.updateMany({
        where: { key: issue.key, status: "Open", customerNotifiedAt: null }, data: { customerNotifiedAt: new Date() },
      });
      sent++;
    } catch (error) {
      console.error("Customer reconciliation notice pending retry.", issue.key, error);
    }
  }
  return sent;
}

export async function runPaymentReconciliation() {
  const prisma = requiredPrisma();
  const checkouts = await prisma.squareCheckout.findMany({
    select: { id: true },
    orderBy: [{ reconciledAt: { sort: "asc", nulls: "first" } }, { createdAt: "asc" }], take: batchSize,
  });
  const entries = await prisma.clubhouseEntryRecord.findMany({
    where: { paymentMethod: "Square" }, select: { id: true },
    orderBy: [{ paymentReconciledAt: { sort: "asc", nulls: "first" } }, { createdAt: "asc" }], take: batchSize,
  });

  for (const checkout of checkouts) await reconcileCheckout(checkout.id);
  for (const entry of entries) {
    try { await reconcileEntry(entry.id); }
    catch (error) { console.error("Square entry reconciliation failed.", entry.id, error); }
  }
  let alerted = 0;
  try { alerted = await alertAdministrators(); }
  catch (error) { console.error("Payment reconciliation alert failed.", error); }

  let customerNotified = 0;
  try { customerNotified = await notifyCustomersOfReconciliationIssues(); }
  catch (error) { console.error("Customer reconciliation notifications failed.", error); }

  return { checkedCheckouts: checkouts.length, checkedEntries: entries.length, alerted, customerNotified };
}
