import { createHash } from "node:crypto";

export const maxRefundEvidenceBytes = 3 * 1024 * 1024;
export const maxRefundEvidenceFilesPerClaim = 5;

type EvidenceFile = Pick<File, "name" | "type" | "size" | "arrayBuffer">;

const signatures = [
  { extensions: ["png"], mimeType: "image/png", prefix: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { extensions: ["jpg", "jpeg"], mimeType: "image/jpeg", prefix: [0xff, 0xd8, 0xff] },
  { extensions: ["pdf"], mimeType: "application/pdf", prefix: [0x25, 0x50, 0x44, 0x46, 0x2d] },
] as const;

export async function prepareRefundEvidence(file: EvidenceFile) {
  if (!Number.isSafeInteger(file.size) || file.size < 32 || file.size > maxRefundEvidenceBytes) {
    throw new Error("Evidence file must be between 32 bytes and 3 MB.");
  }
  const name = file.name.replace(/[\\/\x00-\x1f\x7f]/g, "_").replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 120);
  const extension = name.split(".").at(-1)?.toLowerCase();
  const expected = signatures.find(signature => signature.extensions.some(value => value === extension));
  if (!expected || (file.type && file.type !== expected.mimeType)) {
    throw new Error("Only PNG, JPEG, or PDF evidence files are accepted.");
  }
  const content = new Uint8Array(await file.arrayBuffer());
  if (content.length !== file.size || content.length > maxRefundEvidenceBytes ||
      !expected.prefix.every((byte, index) => content[index] === byte)) {
    throw new Error("Evidence file content does not match its declared type or size.");
  }
  if (expected.mimeType === "image/jpeg" && !(content.at(-2) === 0xff && content.at(-1) === 0xd9)) {
    throw new Error("JPEG evidence file is incomplete.");
  }
  if (expected.mimeType === "application/pdf" && !Buffer.from(content.subarray(Math.max(0, content.length - 1024))).includes(Buffer.from("%%EOF"))) {
    throw new Error("PDF evidence file is incomplete.");
  }
  return {
    originalName: name || `evidence.${extension}`,
    mimeType: expected.mimeType,
    sizeBytes: content.length,
    sha256: createHash("sha256").update(content).digest("hex"),
    content,
  };
}

export type PreparedRefundEvidence = Awaited<ReturnType<typeof prepareRefundEvidence>>;
