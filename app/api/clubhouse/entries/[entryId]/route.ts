import {
  deleteClubhouseEntryRecord,
  getClubhouseEntryRecord,
  updateClubhouseEntryResult,
} from "@/lib/clubhouse-entry-store";
import { isAdminRequestAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ entryId: string }> },
) {
  const { entryId } = await context.params;
  const entry = await getClubhouseEntryRecord(entryId);

  if (!entry) {
    return Response.json({ error: "Entry not found." }, { status: 404 });
  }

  return Response.json({ entry });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ entryId: string }> },
) {
  if (!isAdminRequestAuthenticated(request)) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }

  const { entryId } = await context.params;
  const body = (await request.json()) as {
    result?: unknown;
    resultValue?: unknown;
    resultUnit?: unknown;
    resultStatus?: unknown;
    evidence?: unknown;
  };

  try {
    const entry = await updateClubhouseEntryResult({
      entryId,
      result: typeof body.result === "string" ? body.result : "",
      resultValue:
        typeof body.resultValue === "number"
          ? body.resultValue
          : Number(body.resultValue),
      resultUnit: body.resultUnit === "yards" ? "yards" : "inches",
      resultStatus:
        body.resultStatus === "Needs Review" ||
        body.resultStatus === "Verified" ||
        body.resultStatus === "Rejected"
          ? body.resultStatus
          : "Pending E6 Result",
      evidence: typeof body.evidence === "string" ? body.evidence : "",
    });

    return Response.json({ entry });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not save result." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ entryId: string }> },
) {
  if (!isAdminRequestAuthenticated(request)) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }

  const { entryId } = await context.params;
  const deleted = await deleteClubhouseEntryRecord(entryId);

  if (!deleted) {
    return Response.json({ error: "Entry not found." }, { status: 404 });
  }

  return Response.json({ deleted: true, entryId });
}
