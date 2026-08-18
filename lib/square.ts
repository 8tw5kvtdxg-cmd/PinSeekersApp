import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { getAppBaseUrl } from "@/lib/app-url";

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

function getSquareEnvironmentLabel() {
  return process.env.SQUARE_ENVIRONMENT === "production"
    ? "production"
    : "sandbox";
}

function getSquareWebhookNotificationUrl(request?: Request) {
  const configuredUrl = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL?.trim();

  if (configuredUrl) {
    return configuredUrl;
  }

  return `${getAppBaseUrl(request)}/api/square/webhook`;
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

function getArray(source: Record<string, unknown>, field: string) {
  const value = source[field];

  return Array.isArray(value) ? value : [];
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifySquareWebhookSignature(input: {
  request: Request;
  rawBody: string;
}) {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY?.trim();

  if (!signatureKey) {
    return process.env.NODE_ENV !== "production";
  }

  const signature =
    input.request.headers.get("x-square-hmacsha256-signature") ?? "";
  const notificationUrl = getSquareWebhookNotificationUrl(input.request);
  const expectedSignature = createHmac("sha256", signatureKey)
    .update(`${notificationUrl}${input.rawBody}`)
    .digest("base64");

  return safeEqual(signature, expectedSignature);
}

export async function createSquarePaymentLink(input: {
  amountCents: number;
  buyerEmail?: string;
  buyerPhoneNumber?: string;
  checkoutId: string;
  description: string;
  redirectPath?: string;
  request: Request;
}) {
  const redirectUrl = new URL(
    input.redirectPath ?? "/checkout/success",
    getAppBaseUrl(input.request),
  );
  const prePopulatedData = {
    ...(input.buyerEmail ? { buyer_email: input.buyerEmail } : {}),
    ...(input.buyerPhoneNumber
      ? { buyer_phone_number: input.buyerPhoneNumber }
      : {}),
  };

  redirectUrl.searchParams.set("squareCheckoutId", input.checkoutId);

  const response = await fetch(
    `${getSquareApiBaseUrl()}/v2/online-checkout/payment-links`,
    {
      body: JSON.stringify({
        checkout_options: {
          redirect_url: redirectUrl.toString(),
        },
        description: input.description,
        idempotency_key: randomUUID(),
        payment_note: input.checkoutId,
        ...(Object.keys(prePopulatedData).length > 0
          ? { pre_populated_data: prePopulatedData }
          : {}),
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
    const isUnauthorized =
      response.status === 401 ||
      (Array.isArray(data.errors) &&
        data.errors.some((error) => {
          if (!error || typeof error !== "object") {
            return false;
          }

          const squareError = error as Record<string, unknown>;

          return (
            getString(squareError, "category") === "AUTHENTICATION_ERROR" ||
            getString(squareError, "code") === "UNAUTHORIZED"
          );
        }));

    if (isUnauthorized) {
      throw new Error(
        `Square could not authorize the checkout request. Check that SQUARE_ENVIRONMENT is ${getSquareEnvironmentLabel()} and that SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID are from the same Square ${getSquareEnvironmentLabel()} account.`,
      );
    }

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

export async function getSquarePayment(input: { paymentId: string }) {
  const response = await fetch(
    `${getSquareApiBaseUrl()}/v2/payments/${encodeURIComponent(input.paymentId)}`,
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
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const source = payload as Record<string, unknown>;
  const order = getObject(source, "order");
  const orderSource = Object.keys(order).length > 0 ? order : source;
  const state = getString(orderSource, "state").toUpperCase();
  const tenders = getArray(orderSource, "tenders");
  const fulfillments = getArray(orderSource, "fulfillments");
  const text = JSON.stringify(payload).toLowerCase();

  return (
    (state === "OPEN" && tenders.length > 0) ||
    (state === "COMPLETED" && tenders.length > 0) ||
    fulfillments.some((fulfillment) => {
      if (!fulfillment || typeof fulfillment !== "object") {
        return false;
      }

      return getString(fulfillment as Record<string, unknown>, "state") === "COMPLETED";
    }) ||
    text.includes("\"state\":\"completed\"") ||
    text.includes("\"status\":\"completed\"") ||
    text.includes("\"status\":\"approved\"")
  );
}

export function squarePaymentLooksPaid(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const source = payload as Record<string, unknown>;
  const payment = getObject(source, "payment");
  const paymentSource = Object.keys(payment).length > 0 ? payment : source;
  const status = getString(paymentSource, "status").toUpperCase();

  return status === "COMPLETED" || status === "APPROVED";
}
