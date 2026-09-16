import assert from "node:assert/strict";
import test from "node:test";
import { isSameOriginRequest } from "./request-security.ts";

test("allows matching origins and rejects cross-site mutations", () => {
  assert.equal(
    isSameOriginRequest(
      new Request("https://pin2wingolf.com/api/account/login", {
        method: "POST",
        headers: { origin: "https://pin2wingolf.com" },
      }),
    ),
    true,
  );
  assert.equal(
    isSameOriginRequest(
      new Request("https://pin2wingolf.com/api/account/login", {
        method: "POST",
        headers: { origin: "https://attacker.example" },
      }),
    ),
    false,
  );
  assert.equal(
    isSameOriginRequest(
      new Request("https://pin2wingolf.com/api/account/login", {
        method: "POST",
        headers: { "sec-fetch-site": "cross-site" },
      }),
    ),
    false,
  );
});

test("allows read-only requests without an Origin header", () => {
  assert.equal(
    isSameOriginRequest(
      new Request("https://pin2wingolf.com/api/clubhouse/entries"),
    ),
    true,
  );
});
