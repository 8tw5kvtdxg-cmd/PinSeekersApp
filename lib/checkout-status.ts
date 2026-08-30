export type CheckoutStatus = "Pending" | "Succeeded" | "Failed";

export function canTransitionCheckoutStatus(
  currentStatus: CheckoutStatus,
  nextStatus: CheckoutStatus,
) {
  if (currentStatus === "Succeeded" || currentStatus === "Failed") {
    return false;
  }

  return true;
}
