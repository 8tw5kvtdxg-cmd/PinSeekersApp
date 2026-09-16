export function paidEntryReviewSignals(input: {
  checkoutStatus: string;
  refundStatus: string;
  entryArchived: boolean;
  eventCode: string;
  accessRevealed: boolean;
  resultStatus: string;
  salesState: string;
}) {
  const reviewable = input.checkoutStatus === "Succeeded" &&
    !["Refund Requested", "Refund Pending", "Refunded"].includes(input.refundStatus);
  return {
    archivedPaidEntry: reviewable && input.entryArchived,
    missingEventCode: reviewable && !input.eventCode.trim(),
    challengeHoldMayAffectUnusedEntry: reviewable && input.salesState !== "Open" &&
      !input.accessRevealed && input.resultStatus !== "Verified",
  };
}
