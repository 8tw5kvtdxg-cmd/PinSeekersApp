import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { getAppBaseUrl } from "./app-url.ts";

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

function normalizeSquareBuyerPhoneNumber(value?: string) {
  if (!value) {
    return "";
  }

  const trimmedValue = value.trim();
  const digits = trimmedValue.replace(/\D/g, "");

  if (trimmedValue.startsWith("+") && digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return "";
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
  const buyerPhoneNumber = normalizeSquareBuyerPhoneNumber(
    input.buyerPhoneNumber,
  );
  const prePopulatedData = {
    ...(input.buyerEmail ? { buyer_email: input.buyerEmail } : {}),
    ...(buyerPhoneNumber ? { buyer_phone_number: buyerPhoneNumber } : {}),
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

export async function createSquarePaymentRefund(input: {
  paymentId: string;
  amountCents: number;
  idempotencyKey: string;
  reason: string;
}) {
  const response = await fetch(`${getSquareApiBaseUrl()}/v2/refunds`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${getSquareAccessToken()}`,
      "Content-Type": "application/json",
      "Square-Version": getSquareVersion(),
    },
    method: "POST",
    body: JSON.stringify({
      idempotency_key: input.idempotencyKey,
      payment_id: input.paymentId,
      amount_money: { amount: input.amountCents, currency: "USD" },
      reason: input.reason.slice(0, 192),
    }),
  });
  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok) {
    throw new Error(`Square refund request failed (${response.status}).`);
  }
  const refund = payload && getObject(payload, "refund");
  const id = refund && getString(refund, "id");
  const status = refund && getString(refund, "status").toUpperCase();
  const paymentId = refund && getString(refund, "payment_id");
  const money = refund ? getObject(refund, "amount_money") : {};
  if (!id || paymentId !== input.paymentId || Number(money.amount) !== input.amountCents || getString(money, "currency").toUpperCase() !== "USD" || !["PENDING", "COMPLETED", "FAILED", "REJECTED"].includes(status || "")) {
    throw new Error("Square refund response was not usable; check Square before retrying.");
  }
  return { id, status: status! };
}

export async function getSquarePaymentRefund(input: { refundId: string; paymentId: string; amountCents: number }) {
  const response = await fetch(`${getSquareApiBaseUrl()}/v2/refunds/${encodeURIComponent(input.refundId)}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${getSquareAccessToken()}`,
      "Square-Version": getSquareVersion(),
    },
  });
  if (!response.ok) throw new Error(`Square refund status lookup failed (${response.status}).`);
  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  const refund = payload && getObject(payload, "refund");
  const status = refund && getString(refund, "status").toUpperCase();
  const money = refund ? getObject(refund, "amount_money") : {};
  if (getString(refund || {}, "id") !== input.refundId || getString(refund || {}, "payment_id") !== input.paymentId || Number(money.amount) !== input.amountCents || getString(money, "currency").toUpperCase() !== "USD" || !status || !["PENDING", "COMPLETED", "FAILED", "REJECTED"].includes(status)) {
    throw new Error("Square refund status was not usable.");
  }
  return { id: input.refundId, status };
}

export function squareOrderLooksPaid(
  payload: unknown,
  expectedAmountCents?: number,
) {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const source = payload as Record<string, unknown>;
  const order = getObject(source, "order");
  const orderSource = Object.keys(order).length > 0 ? order : source;
  const state = getString(orderSource, "state").toUpperCase();
  const totalMoney = getObject(orderSource, "total_money");
  const totalAmount = Number(totalMoney.amount);
  const netAmountDueMoney = getObject(orderSource, "net_amount_due_money");
  const netAmountDue = Number(netAmountDueMoney.amount);
  const amountMatches =
    expectedAmountCents === undefined || totalAmount === expectedAmountCents;

  return (
    amountMatches &&
    (state === "COMPLETED" ||
      (state === "OPEN" &&
        Object.keys(netAmountDueMoney).length > 0 &&
        netAmountDue === 0))
  );
}

export function getSquareOrderPaymentIds(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const source = payload as Record<string, unknown>;
  const order = getObject(source, "order");
  const orderSource = Object.keys(order).length > 0 ? order : source;

  return getArray(orderSource, "tenders")
    .map((tender) => {
      if (!tender || typeof tender !== "object") {
        return "";
      }

      const tenderSource = tender as Record<string, unknown>;

      return getString(tenderSource, "payment_id") || getString(tenderSource, "id");
    })
    .filter((paymentId, index, paymentIds) =>
      Boolean(paymentId) && paymentIds.indexOf(paymentId) === index,
    );
}

export function squarePaymentLooksPaid(
  payload: unknown,
  input: { amountCents: number; orderId: string },
) {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const source = payload as Record<string, unknown>;
  const data = getObject(source, "data");
  const webhookObject = getObject(data, "object");
  const topLevelPayment = getObject(source, "payment");
  const payment =
    Object.keys(topLevelPayment).length > 0
      ? topLevelPayment
      : getObject(webhookObject, "payment");
  const paymentSource = Object.keys(payment).length > 0 ? payment : source;
  const amountMoney = getObject(paymentSource, "amount_money");

  return (
    getString(paymentSource, "status").toUpperCase() === "COMPLETED" &&
    getString(paymentSource, "order_id") === input.orderId &&
    Number(amountMoney.amount) === input.amountCents &&
    getString(amountMoney, "currency").toUpperCase() === "USD"
  );
}

export function getSquarePaymentId(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const source = payload as Record<string, unknown>;
  const data = getObject(source, "data");
  const webhookObject = getObject(data, "object");
  const payment = getObject(source, "payment");
  const paymentSource =
    Object.keys(payment).length > 0
      ? payment
      : getObject(webhookObject, "payment");

  return getString(paymentSource, "id");
}

export function getSquarePaymentCreatedAt(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const source = payload as Record<string, unknown>;
  const webhookObject = getObject(getObject(source, "data"), "object");
  const topLevelPayment = getObject(source, "payment");
  const payment = Object.keys(topLevelPayment).length > 0
    ? topLevelPayment : getObject(webhookObject, "payment");
  const paymentSource = Object.keys(payment).length > 0 ? payment : source;
  const raw = getString(paymentSource, "created_at");
  const date = new Date(raw);
  return raw && Number.isFinite(date.getTime()) && date.getTime() <= Date.now()
    ? date.toISOString() : "";
}

export async function verifySquareOrderPayment(input: {
  amountCents: number;
  orderId: string;
}) {
  const order = await getSquareOrder({ orderId: input.orderId });

  for (const paymentId of getSquareOrderPaymentIds(order)) {
    const payment = await getSquarePayment({ paymentId });

    if (squarePaymentLooksPaid(payment, input)) {
      return { isPaid: true, paymentId, paymentCreatedAt: getSquarePaymentCreatedAt(payment) };
    }
  }

  // Square Payment Link orders can remain OPEN after a successful payment.
  // A zero net amount due is Square's order-level signal that nothing remains
  // to be collected, and is safe here only after also checking the order total.
  return {
    isPaid: squareOrderLooksPaid(order, input.amountCents),
    paymentId: "",
    paymentCreatedAt: "",
  };
}
