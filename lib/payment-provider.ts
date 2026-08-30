export type PaymentProvider = "payarc" | "square";

export function getPaymentProvider(): PaymentProvider {
  const configured = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();

  if (configured === "payarc") {
    return "payarc";
  }

  return "square";
}

export function getPaymentProviderLabel(provider = getPaymentProvider()) {
  return provider === "payarc" ? "Payarc" : "Square";
}

export function isLegacyPayarcEnabled() {
  return (
    process.env.PAYMENT_PROVIDER?.trim().toLowerCase() === "payarc" &&
    Boolean(process.env.PAYARC_ACCESS_TOKEN)
  );
}
