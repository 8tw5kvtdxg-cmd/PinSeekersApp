import { getAdminRequestIdentity } from "@/lib/admin-auth";
import { getCurrentVerifiedPlayer } from "@/lib/player-auth";
import { getPrismaClient } from "@/lib/prisma";
import { createHash } from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ evidenceId: string }> }) {
  const { evidenceId } = await context.params;
  if (!/^[a-zA-Z0-9_-]{10,80}$/.test(evidenceId)) return Response.json({ error: "Evidence not found." }, { status: 404 });
  const prisma = getPrismaClient();
  if (!prisma) return Response.json({ error: "Evidence temporarily unavailable." }, { status: 503 });
  const metadata = await prisma.paymentIssueEvidence.findUnique({ where: { id: evidenceId }, select: {
    id: true, claimId: true, mimeType: true, sizeBytes: true, sha256: true, claim: { select: { playerId: true } },
  } });
  if (!metadata) return Response.json({ error: "Evidence not found." }, { status: 404 });
  const admin = await getAdminRequestIdentity(request);
  const player = admin ? null : (await getCurrentVerifiedPlayer()).player;
  if (!admin && (!player || player.id !== metadata.claim.playerId)) {
    return Response.json({ error: "Evidence access denied." }, { status: 403 });
  }
  const evidence = await prisma.paymentIssueEvidence.findUnique({ where: { id: evidenceId }, select: { content: true } });
  if (!evidence) return Response.json({ error: "Evidence not found." }, { status: 404 });
  if (evidence.content.length !== metadata.sizeBytes || createHash("sha256").update(evidence.content).digest("hex") !== metadata.sha256) {
    console.error("Refund evidence integrity check failed.", evidenceId);
    return Response.json({ error: "Evidence integrity check failed." }, { status: 500 });
  }
  const extension = metadata.mimeType === "image/png" ? "png" : metadata.mimeType === "image/jpeg" ? "jpg" : "pdf";
  return new Response(new Uint8Array(evidence.content).buffer, { headers: {
    "Content-Type": "application/octet-stream",
    "Content-Disposition": `attachment; filename="pin2win-evidence-${metadata.id}.${extension}"`,
    "Content-Length": String(metadata.sizeBytes),
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "sandbox",
  } });
}
