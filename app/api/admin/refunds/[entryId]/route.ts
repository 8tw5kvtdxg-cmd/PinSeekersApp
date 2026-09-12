import {
  getAdminRequestIdentity,
  isAdminRequestAuthenticated,
} from "@/lib/admin-auth";
import { executeClosureSquareRefund } from "@/lib/square-refund-store";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ entryId: string }> },
) {
  if (!(await isAdminRequestAuthenticated(request))) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }

  const requestedBy = getAdminRequestIdentity(request);

  if (!requestedBy) {
    return Response.json({ error: "Admin identity is required." }, { status: 401 });
  }

  const body = (await request.json()) as {
    confirm?: unknown;
    reason?: unknown;
  };

  if (body.confirm !== true) {
    return Response.json(
      { error: "Explicit refund confirmation is required." },
      { status: 400 },
    );
  }

  const { entryId } = await context.params;

  try {
    const refund = await executeClosureSquareRefund({
      entryId,
      reason: typeof body.reason === "string" ? body.reason : undefined,
      requestedBy,
    });

    return Response.json({ refund });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Square refund could not be issued.",
      },
      { status: 400 },
    );
  }
}
