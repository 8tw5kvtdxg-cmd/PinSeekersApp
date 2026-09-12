export type CheckoutStatus =
  | "Pending"
  | "Succeeded"
  | "Failed"
  | "Refund Pending"
  | "Partially Refunded"
  | "Refunded";

export function canTransitionCheckoutStatus(
  currentStatus: CheckoutStatus,
  nextStatus: CheckoutStatus,
) {
  return (
    currentStatus === nextStatus ||
    (currentStatus === "Pending" &&
      (nextStatus === "Succeeded" || nextStatus === "Failed"))
  );
}
