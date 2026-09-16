import { createHmac } from "node:crypto";
import { getPrismaClient } from "@/lib/prisma";

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

const memoryBuckets = new Map<string, { count: number; expiresAt: number }>();

function rateLimitSecret() {
  return (
    process.env.PIN2WIN_RATE_LIMIT_SECRET ||
    process.env.PIN2WIN_ADMIN_SESSION_SECRET ||
    "pin2win-local-rate-limit-secret"
  );
}

export function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function bucketKey(namespace: string, identifier: string) {
  return createHmac("sha256", rateLimitSecret())
    .update(`${namespace}\n${identifier.trim().toLowerCase().slice(0, 320)}`)
    .digest("hex");
}

function resultFor(count: number, limit: number, expiresAt: Date, now: Date) {
  return {
    allowed: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((expiresAt.getTime() - now.getTime()) / 1000),
    ),
  } satisfies RateLimitResult;
}

function consumeMemoryBucket(input: {
  key: string;
  limit: number;
  now: Date;
  windowMs: number;
}) {
  const nowMs = input.now.getTime();
  const existing = memoryBuckets.get(input.key);
  const bucket =
    !existing || existing.expiresAt <= nowMs
      ? { count: 1, expiresAt: nowMs + input.windowMs }
      : { ...existing, count: existing.count + 1 };

  memoryBuckets.set(input.key, bucket);
  return resultFor(bucket.count, input.limit, new Date(bucket.expiresAt), input.now);
}

export async function consumeRateLimit(input: {
  namespace: string;
  identifier: string;
  limit: number;
  windowMs: number;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const key = bucketKey(input.namespace, input.identifier);
  const prisma = getPrismaClient();

  if (!prisma) {
    return consumeMemoryBucket({
      key,
      limit: input.limit,
      now,
      windowMs: input.windowMs,
    });
  }

  const nextExpiry = new Date(now.getTime() + input.windowMs);
  const rows = await prisma.$queryRaw<
    Array<{ requestCount: number; expiresAt: Date }>
  >`
    INSERT INTO "SecurityRateLimitBucket"
      ("key", "namespace", "requestCount", "windowStartedAt", "expiresAt", "updatedAt")
    VALUES
      (${key}, ${input.namespace}, 1, ${now}, ${nextExpiry}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "requestCount" = CASE
        WHEN "SecurityRateLimitBucket"."expiresAt" <= ${now} THEN 1
        ELSE "SecurityRateLimitBucket"."requestCount" + 1
      END,
      "windowStartedAt" = CASE
        WHEN "SecurityRateLimitBucket"."expiresAt" <= ${now} THEN ${now}
        ELSE "SecurityRateLimitBucket"."windowStartedAt"
      END,
      "expiresAt" = CASE
        WHEN "SecurityRateLimitBucket"."expiresAt" <= ${now} THEN ${nextExpiry}
        ELSE "SecurityRateLimitBucket"."expiresAt"
      END,
      "updatedAt" = ${now}
    RETURNING "requestCount", "expiresAt"
  `;
  const bucket = rows[0];

  if (!bucket) throw new Error("Rate limit could not be evaluated.");
  return resultFor(bucket.requestCount, input.limit, bucket.expiresAt, now);
}

export function rateLimitResponse(result: RateLimitResult) {
  return Response.json(
    { error: "Too many requests. Please wait and try again." },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  );
}
