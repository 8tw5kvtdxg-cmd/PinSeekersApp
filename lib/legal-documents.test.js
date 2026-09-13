import assert from "node:assert/strict";
import test from "node:test";
import {
  getLegalDocumentSnapshot,
  legalDocumentVersion,
  validateAccountCreationConsent,
} from "./legal-documents.ts";

test("creates stable SHA-256 hashes for every consent document", () => {
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
});

test("requires every account-creation agreement", () => {
  assert.throws(
    () =>
      validateAccountCreationConsent({
        age18Accepted: true,
        legalDocumentsAccepted: true,
        texasResidencyAccepted: false,
      }),
    /must accept/i,
  );

  assert.equal(
    validateAccountCreationConsent({
      age18Accepted: true,
      legalDocumentsAccepted: true,
      texasResidencyAccepted: true,
    }).documentVersion,
    legalDocumentVersion,
  );
});
