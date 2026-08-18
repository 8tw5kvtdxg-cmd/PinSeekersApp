export type PaymentProvider = "payarc" | "square";

export function getPaymentProvider(): PaymentProvider {
  return process.env.PAYMENT_PROVIDER === "payarc" ? "payarc" : "square";
}

export function getPaymentProviderLabel(provider = getPaymentProvider()) {
  return provider === "payarc" ? "Payarc" : "Square";
}
