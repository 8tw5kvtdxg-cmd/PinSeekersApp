import { readFileSync } from "node:fs";
import { join } from "node:path";

export const legalDocumentVersion = "2026.09-DRAFT";
export const legalDocumentStatus = "legal-review-draft" as const;
export const legalDraftDate = "September 11, 2026";

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

