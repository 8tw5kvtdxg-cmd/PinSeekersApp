import { randomUUID } from "node:crypto";

export type SquarePaymentLink = {
  id: string;
  orderId: string;
  url: string;
};

function getSquareApiBaseUrl() {
  return process.env.SQUARE_ENVIRONMENT === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

function getSquareAccessToken() {
  const token = process.env.SQUARE_ACCESS_TOKEN?.trim();

  if (!token) {
    throw new Error("Square access token is not configured.");
  }

  return token;
}

function getSquareLocationId() {
  const locationId = process.env.SQUARE_LOCATION_ID?.trim();

  if (!locationId) {
    throw new Error("Square location ID is not configured.");
  }

  return locationId;
}

function getSquareVersion() {
  return process.env.SQUARE_VERSION?.trim() || "2026-07-15";
}

function getAppBaseUrl(request: Request) {
  const configuredUrl =
    process.env.PIN2WIN_APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_URL;

  if (configuredUrl) {
    return configuredUrl.startsWith("http")
      ? configuredUrl
      : `https://${configuredUrl}`;
  }

  return new URL(request.url).origin;
}

function getString(source: Record<string, unknown>, field: string) {
  const value = source[field];

  return typeof value === "string" ? value : "";
}

function getObject(source: Record<string, unknown>, field: string) {
  const value = source[field];

  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function createSquarePaymentLink(input: {
  amountCents: number;
  checkoutId: string;
  description: string;
  request: Request;
}) {
  const response = await fetch(
    `${getSquareApiBaseUrl()}/v2/online-checkout/payment-links`,
    {
      body: JSON.stringify({
        checkout_options: {
          redirect_url: `${getAppBaseUrl(input.request)}/checkout/success?squareCheckoutId=${encodeURIComponent(
            input.checkoutId,
          )}`,
        },
        description: input.description,
        idempotency_key: randomUUID(),
        payment_note: input.checkoutId,
        quick_pay: {
          location_id: getSquareLocationId(),
          name: input.description,
          price_money: {
            amount: input.amountCents,
            currency: "USD",
          },
        },
      }),
      headers: {
        Authorization: `Bearer ${getSquareAccessToken()}`,
        "Content-Type": "application/json",
        "Square-Version": getSquareVersion(),
      },
      method: "POST",
    },
  );
  const data = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    const errors = Array.isArray(data.errors)
      ? data.errors
          .map((error) =>
            error && typeof error === "object"
              ? getString(error as Record<string, unknown>, "detail")
              : "",
          )
          .filter(Boolean)
          .join(" ")
      : "";

    throw new Error(errors || "Square checkout could not be created.");
  }

  const paymentLink = getObject(data, "payment_link");
  const id = getString(paymentLink, "id");
  const orderId = getString(paymentLink, "order_id");
  const url = getString(paymentLink, "url") || getString(paymentLink, "long_url");

  if (!id || !orderId || !url) {
    throw new Error("Square did not return a usable checkout link.");
  }

  return { id, orderId, url } satisfies SquarePaymentLink;
}

export async function getSquareOrder(input: { orderId: string }) {
  const response = await fetch(
    `${getSquareApiBaseUrl()}/v2/orders/${encodeURIComponent(input.orderId)}`,
    {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${getSquareAccessToken()}`,
        "Content-Type": "application/json",
        "Square-Version": getSquareVersion(),
      },
      method: "GET",
    },
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json().catch(() => null)) as Record<string, unknown> | null;
}

export function squareOrderLooksPaid(payload: unknown) {
  const text = JSON.stringify(payload).toLowerCase();

  return (
    text.includes("\"state\":\"completed\"") ||
    text.includes("\"status\":\"completed\"") ||
    text.includes("\"status\":\"approved\"")
  );
}
