import type { Prisma } from "../app/generated/prisma/client";

// Keep customer submissions and all human-handled/refunding legacy records in
// the main queue. Untouched automatic records remain available as history.
export const customerManagedClaimWhere: Prisma.PaymentIssueClaimWhereInput = {
  OR: [
    { systemIssueKey: null },
    { refund: { isNot: null } },
    { events: { some: { actorId: { not: "system" } } } },
    { evidenceFiles: { some: {} } },
    { assignedTo: { not: null } },
    { status: { in: ["In Review", "Approved", "Denied", "Refund Requested", "Refund Pending", "Refunded", "Partially Refunded"] } },
  ],
};
export const automaticClaimHistoryWhere: Prisma.PaymentIssueClaimWhereInput = { NOT: customerManagedClaimWhere };

export const refundNotificationEventWhere: Prisma.PaymentIssueEventWhereInput = {
  claim: customerManagedClaimWhere,
  OR: [
    { claim: { systemIssueKey: null } },
    { actorId: { not: "system" } },
    { action: { startsWith: "Square refund " } },
  ],
};
