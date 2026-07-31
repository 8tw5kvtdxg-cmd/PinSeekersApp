export type PayarcEnvironment = "test" | "live";

export type PayarcOrder = {
  id: string;
  token: string;
  paymentFormUrl: string;
};

function getPayarcEnvironment(): PayarcEnvironment {
  return process.env.PAYARC_ENVIRONMENT === "live" ? "live" : "test";
}

export function getPayarcCheckoutScriptUrl() {
  if (process.env.PAYARC_CHECKOUT_SCRIPT_URL) {
    return process.env.PAYARC_CHECKOUT_SCRIPT_URL;
  }

  return getPayarcEnvironment() === "live"
    ? "https://payarc-checkout.s3.us-east-2.amazonaws.com/live/payarc.js"
    : "https://payarc-checkout.s3.us-east-2.amazonaws.com/test/payarc.js";
}

function getPayarcApiBaseUrl() {
  if (process.env.PAYARC_API_BASE_URL) {
    return process.env.PAYARC_API_BASE_URL.replace(/\/$/, "");
  }

  return getPayarcEnvironment() === "live"
    ? "https://api.payarc.net"
    : "https://testapi.payarc.net";
}

function getPayarcAccessToken() {
  const token = process.env.PAYARC_ACCESS_TOKEN?.trim();

  if (!token) {
    throw new Error("Payarc access token is not configured.");
  }

  return token;
}

function readStringField(source: Record<string, unknown>, field: string) {
  const value = source[field];

  return typeof value === "string" ? value : "";
}

export async function createPayarcOrder(input: {
  amountCents: number;
  orderName: string;
}) {
  const body = new URLSearchParams({
    amount: String(input.amountCents),
    order_name: input.orderName,
  });
  const surchargePercent = process.env.PAYARC_SURCHARGE_PERCENT?.trim();

  if (surchargePercent) {
    body.set("surcharge_percent", surchargePercent);
  }

  const response = await fetch(`${getPayarcApiBaseUrl()}/v1/orders/`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${getPayarcAccessToken()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    const message =
      readStringField(data, "message") ||
      readStringField(data, "error") ||
      "Payarc checkout could not be created.";

    throw new Error(message);
  }

  const orderData =
    data.data && typeof data.data === "object" && !Array.isArray(data.data)
      ? (data.data as Record<string, unknown>)
      : data;
  const id = readStringField(orderData, "id");
  const token = readStringField(orderData, "token");
  const paymentFormUrl =
    readStringField(orderData, "payment_form_url") ||
    readStringField(orderData, "paymentFormUrl");

  if (!id || !token || !paymentFormUrl) {
    throw new Error("Payarc did not return a usable checkout order.");
  }

  return { id, token, paymentFormUrl } satisfies PayarcOrder;
}

export async function verifyPayarcOrderSucceeded(input: {
  orderName: string;
  amountCents: number;
}) {
  const params = new URLSearchParams({
    order_name: input.orderName,
    amount: String(input.amountCents),
    status: "SUCCESS",
  });
  const response = await fetch(
    `${getPayarcApiBaseUrl()}/v1/orders/customer/get?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${getPayarcAccessToken()}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return false;
  }

  const data = (await response.json().catch(() => null)) as unknown;
  const text = JSON.stringify(data).toLowerCase();

  return (
    text.includes(input.orderName.toLowerCase()) &&
    (text.includes("success") ||
      text.includes("submitted_for_settlement") ||
      text.includes("captured"))
  );
}
