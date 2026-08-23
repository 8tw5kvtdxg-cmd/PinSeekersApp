import { isAdminRequestAuthenticated } from "@/lib/admin-auth";
import {
  createOperatingCost,
  deleteOperatingCost,
  updateOperatingCost,
} from "@/lib/operating-cost-store";

export const dynamic = "force-dynamic";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanAmountCents(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,]/g, ""));

    if (Number.isFinite(parsed)) {
      return Math.round(parsed * 100);
    }
  }

  return Number.NaN;
}

async function parseCostBody(request: Request) {
  const body = (await request.json()) as {
    id?: unknown;
    incurredAt?: unknown;
    vendor?: unknown;
    category?: unknown;
    description?: unknown;
    amountCents?: unknown;
    amount?: unknown;
    paymentMethod?: unknown;
    account?: unknown;
    isDeductible?: unknown;
  };

  return {
    id: cleanText(body.id),
    incurredAt: cleanText(body.incurredAt),
    vendor: cleanText(body.vendor),
    category: cleanText(body.category),
    description: cleanText(body.description),
    amountCents: cleanAmountCents(body.amountCents ?? body.amount),
    paymentMethod: cleanText(body.paymentMethod),
    account: cleanText(body.account),
    isDeductible:
      typeof body.isDeductible === "boolean" ? body.isDeductible : true,
  };
}

function validateCost(input: {
  incurredAt: string;
  vendor: string;
  category: string;
  amountCents: number;
}) {
  if (!input.incurredAt || !input.vendor || !input.category) {
    return "Date, vendor, and category are required.";
  }

  if (!Number.isFinite(input.amountCents) || input.amountCents < 0) {
    return "A valid cost amount is required.";
  }

  return "";
}

export async function POST(request: Request) {
  if (!(await isAdminRequestAuthenticated(request))) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }

  const input = await parseCostBody(request);
  const validationError = validateCost(input);

  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  try {
    const cost = await createOperatingCost(input);

    return Response.json({ cost }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not create cost.",
      },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequestAuthenticated(request))) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }

  const input = await parseCostBody(request);
  const validationError = validateCost(input);

  if (!input.id) {
    return Response.json({ error: "Cost ID is required." }, { status: 400 });
  }

  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  try {
    const cost = await updateOperatingCost({
      ...input,
      id: input.id,
    });

    return Response.json({ cost });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update cost.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequestAuthenticated(request))) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id")?.trim() ?? "";

  if (!id) {
    return Response.json({ error: "Cost ID is required." }, { status: 400 });
  }

  try {
    await deleteOperatingCost(id);

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not delete cost.",
      },
      { status: 400 },
    );
  }
}
