import { test } from "node:test";
import assert from "node:assert/strict";
import { validateProfile } from "./profile";

test("accepts optional usernames and the exact length boundaries", () => {
  for (const username of [null, "abc", "a".repeat(100)]) {
    assert.doesNotThrow(() => validateProfile({ username }));
  }
});

test("rejects malformed profiles and invalid usernames", () => {
  for (const profile of [
    null, undefined, [], {}, "username",
    { username: 123 }, { username: "" }, { username: "ab" },
    { username: "a".repeat(101) }, { username: " abc" }, { username: "abc " },
  ]) {
    assert.throws(() => validateProfile(profile));
  }
});
