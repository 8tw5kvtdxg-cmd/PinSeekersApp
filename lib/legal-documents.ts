import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

export const legalDocumentVersion = "2026.09.15";
export const legalDocumentStatus = "approved" as const;
export const legalPublishedDate = "September 15, 2026";
export const legalEffectiveDate = "September 1, 2026";

export const legalAcceptanceTexts = {
  legalDocuments:
    "I have reviewed and agree to the Terms of Use, Official Rules, Refund Policy, and Privacy Policy.",
  age18: "I certify that I am at least 18 years old.",
  texasResidency: "I certify that I am a Texas resident.",
  onsitePresence:
    "I certify that I am physically present at the participating Texas location and bay identified for this entry.",
} as const;

export type LegalDocumentKey =
  | "terms"
  | "official-rules"
  | "refund-policy"
  | "privacy";

const documentParts: Record<
  LegalDocumentKey,
  { start: string; end: string | null; title: string; shortTitle: string }
> = {
  terms: {
    start: "# Part I — Terms of Use",
    end: "# Part II — Official Rules",
    title: "Terms of Use",
    shortTitle: "Terms",
  },
  "official-rules": {
    start: "# Part II — Official Rules",
    end: "# Part III — Refund and Payment Issue Policy",
    title: "Official Rules for the Pin2Win $5,000 Hole-in-One Challenge",
    shortTitle: "Official Rules",
  },
  "refund-policy": {
    start: "# Part III — Refund and Payment Issue Policy",
    end: "# Part IV — Privacy Policy",
    title: "Refund and Payment Issue Policy",
    shortTitle: "Refund Policy",
  },
  privacy: {
    start: "# Part IV — Privacy Policy",
    end: "# Internal Launch Checklist",
    title: "Privacy Policy",
    shortTitle: "Privacy",
  },
};

export function getLegalDocumentDefinition(key: LegalDocumentKey) {
  return documentParts[key];
}

export function getLegalDocumentMarkdown(key: LegalDocumentKey) {
  const source = readFileSync(
    join(
      process.cwd(),
      "docs",
      "Pin2Win_Customer_Terms_and_Challenge_Rules_Draft.md",
    ),
    "utf8",
  );
  const definition = documentParts[key];
  const startIndex = source.indexOf(definition.start);

  if (startIndex < 0) {
    throw new Error(`Legal document section was not found: ${key}`);
  }

  const contentStart = source.indexOf("\n", startIndex) + 1;
  const endIndex = definition.end
    ? source.indexOf(definition.end, contentStart)
    : source.length;

  if (endIndex < 0) {
    throw new Error(`Legal document end marker was not found: ${key}`);
  }

  return source
    .slice(contentStart, endIndex)
    .replace(/\n---\s*$/, "")
    .trim();
}

export function getLegalDocumentSnapshot() {
  const keys: LegalDocumentKey[] = [
    "terms",
    "official-rules",
    "refund-policy",
    "privacy",
  ];
  const documentHashes = Object.fromEntries(
    keys.map((key) => {
      const markdown = getLegalDocumentMarkdown(key);
      const hash = createHash("sha256")
        .update(`${legalDocumentVersion}\n${key}\n${markdown}`, "utf8")
        .digest("hex");

      return [key, hash];
    }),
  ) as Record<LegalDocumentKey, string>;
  const combinedDocumentHash = createHash("sha256")
    .update(
      keys.map((key) => `${key}:${documentHashes[key]}`).join("\n"),
      "utf8",
    )
    .digest("hex");

  return {
    acceptanceText: legalAcceptanceTexts,
    combinedDocumentHash,
    documentHashes,
    documentVersion: legalDocumentVersion,
  };
}

export function validateLegalAcceptance(input: {
  documentVersion: unknown;
  legalDocumentsAccepted: unknown;
  age18Accepted: unknown;
  texasResidencyAccepted: unknown;
  onsitePresenceAccepted: unknown;
}) {
  if (input.documentVersion !== legalDocumentVersion) {
    throw new Error(
      "The legal documents changed before checkout. Review the current documents and try again.",
    );
  }

  if (
    input.legalDocumentsAccepted !== true ||
    input.age18Accepted !== true ||
    input.texasResidencyAccepted !== true ||
    input.onsitePresenceAccepted !== true
  ) {
    throw new Error("All legal agreements and eligibility attestations are required.");
  }

  return getLegalDocumentSnapshot();
}

export function validateAccountCreationConsent(input: {
  legalDocumentsAccepted: unknown;
  age18Accepted: unknown;
  texasResidencyAccepted: unknown;
}) {
  if (
    input.legalDocumentsAccepted !== true ||
    input.age18Accepted !== true ||
    input.texasResidencyAccepted !== true
  ) {
    throw new Error(
      "You must accept the legal documents and confirm your eligibility to create an account.",
    );
  }

  return getLegalDocumentSnapshot();
}
