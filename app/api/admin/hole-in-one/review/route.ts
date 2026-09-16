import { getAdminRequestIdentity } from "@/lib/admin-auth";
import { resumeChallengeSales, reviewHoleInOneReport } from "@/lib/hole-in-one";
import { rejectCrossSiteRequest } from "@/lib/request-security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;
  const admin = await getAdminRequestIdentity(request);
  if (!admin) return Response.json({ error: "Administrator login required." }, { status: 401 });
  const body = await request.formData();
  const action = body.get("action");
  const note = body.get("note");
  const reportId = body.get("reportId");
  const challengeSlug = body.get("challengeSlug");
  const returnUrl = new URL("/admin/winners", request.url);

  try {
    if (action === "verify" || action === "reject") {
      if (typeof reportId !== "string" || !reportId.trim()) throw new Error("Report ID is required.");
      await reviewHoleInOneReport({
        reportId: reportId.trim(), actorId: admin.id, actorEmail: admin.email,
        action: action === "verify" ? "Verify" : "Reject", note,
        timestampReliable: body.get("timestampReliable") === "on",
      });
    } else if (action === "resume") {
      if (typeof challengeSlug !== "string" || !challengeSlug.trim()) throw new Error("Challenge is required.");
      await resumeChallengeSales({ challengeSlug: challengeSlug.trim(), actorId: admin.id, actorEmail: admin.email, note });
    } else {
      throw new Error("Unknown review action.");
    }
    returnUrl.searchParams.set("message", "Review action saved.");
  } catch (error) {
    returnUrl.searchParams.set("error", error instanceof Error ? error.message.slice(0, 200) : "Review action failed.");
  }
  return Response.redirect(returnUrl, 303);
}
