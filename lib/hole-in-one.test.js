import assert from "node:assert/strict";
import test from "node:test";
import {
  isChallengeCheckoutBlocked,
  selectHoleInOneWinnerIds,
} from "./hole-in-one.ts";

test("selects the earliest verified hole-in-one by source timestamp", () => {
  assert.deepEqual(
    selectHoleInOneWinnerIds([
      {
        id: "later",
        isHoleInOne: true,
        resultStatus: "Verified",
        resultOccurredAt: "2026-09-12T18:01:00.000Z",
      },
      {
        id: "earlier",
        isHoleInOne: true,
        resultStatus: "Verified",
        resultOccurredAt: "2026-09-12T18:00:00.000Z",
      },
      {
        id: "rejected",
        isHoleInOne: true,
        resultStatus: "Rejected",
        resultOccurredAt: "2026-09-12T17:59:00.000Z",
      },
    ]),
    ["earlier"],
  );
});

test("returns all tied earliest IDs when source timestamps are identical", () => {
  assert.deepEqual(
    selectHoleInOneWinnerIds([
      {
        id: "b",
        isHoleInOne: true,
        resultStatus: "Verified",
        resultOccurredAt: "2026-09-12T18:00:00.000Z",
      },
      {
        id: "a",
        isHoleInOne: true,
        resultStatus: "Verified",
        resultOccurredAt: "2026-09-12T18:00:00.000Z",
      },
    ]),
    ["a", "b"],
  );
});

test("requires explicit equal-split approval when chronology is missing", () => {
  assert.throws(
    () =>
      selectHoleInOneWinnerIds([
        { id: "a", isHoleInOne: true, resultStatus: "Verified" },
      ]),
    /chronology cannot be determined/i,
  );

  assert.deepEqual(
    selectHoleInOneWinnerIds(
      [
        { id: "b", isHoleInOne: true, resultStatus: "Verified" },
        { id: "a", isHoleInOne: true, resultStatus: "Verified" },
      ],
      true,
    ),
    ["a", "b"],
  );
});

test("blocks checkout while a claim is paused or the challenge is closed", () => {
  assert.equal(isChallengeCheckoutBlocked("ACTIVE"), false);
  assert.equal(isChallengeCheckoutBlocked("PAUSED"), true);
  assert.equal(isChallengeCheckoutBlocked("CLOSED"), true);
});
