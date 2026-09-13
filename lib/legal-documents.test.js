import assert from "node:assert/strict";
import test from "node:test";
import {
  getLegalDocumentSnapshot,
  legalDocumentVersion,
  validateLegalAcceptance,
} from "./legal-documents.ts";

test("creates stable SHA-256 hashes for every accepted legal document", () => {
  const first = getLegalDocumentSnapshot();
  const second = getLegalDocumentSnapshot();

  assert.deepEqual(first, second);
  assert.equal(first.documentVersion, legalDocumentVersion);
  assert.match(first.combinedDocumentHash, /^[a-f0-9]{64}$/);
  assert.deepEqual(Object.keys(first.documentHashes).sort(), [
    "official-rules",
    "privacy",
    "refund-policy",
    "terms",
  ]);
  Object.values(first.documentHashes).forEach((hash) => {
    assert.match(hash, /^[a-f0-9]{64}$/);
  });
});

test("rejects missing attestations and stale document versions", () => {
  assert.throws(
    () =>
      validateLegalAcceptance({
        age18Accepted: true,
        documentVersion: legalDocumentVersion,
        legalDocumentsAccepted: true,
        onsitePresenceAccepted: false,
        texasResidencyAccepted: true,
      }),
    /all legal agreements/i,
  );
  assert.throws(
    () =>
      validateLegalAcceptance({
        age18Accepted: true,
        documentVersion: "old-version",
        legalDocumentsAccepted: true,
        onsitePresenceAccepted: true,
        texasResidencyAccepted: true,
      }),
    /documents changed/i,
  );
});
