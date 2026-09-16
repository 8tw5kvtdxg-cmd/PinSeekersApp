export function isLateRefundClaim(paidAt: Date, incidentAt: Date | null, submittedAt = new Date()) {
  const reference = incidentAt && incidentAt > paidAt ? incidentAt : paidAt;
  const deadline = new Date(reference);
  deadline.setUTCDate(deadline.getUTCDate() + 14);
  return submittedAt > deadline;
}

export function deriveRefundState(input: {
  providerStatus: string; completedAmountCents: number; checkoutAmountCents: number;
}) {
  const { providerStatus, completedAmountCents, checkoutAmountCents } = input;
  const refundStatus = completedAmountCents >= checkoutAmountCents
    ? "Refunded"
    : providerStatus === "COMPLETED"
    ? "Partially Refunded"
    : providerStatus === "PENDING" ? "Refund Pending"
    : completedAmountCents > 0 ? "Partially Refunded" : "Refund Failed";
  return {
    refundStatus,
    claimStatus: providerStatus === "COMPLETED" ? refundStatus : providerStatus === "PENDING" ? "Refund Pending" : "Refund Failed",
    entryPaymentStatus: refundStatus === "Refunded" ? "Refunded" : refundStatus === "Refund Pending" ? "Refund Pending" : "Succeeded",
  };
}
