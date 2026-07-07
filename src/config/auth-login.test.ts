import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveEmailOnlyLoginEnabled } from "@/config/auth-login";

describe("resolveEmailOnlyLoginEnabled", () => {
  it("disables email-only login when whitelist mode is inactive", () => {
    assert.equal(resolveEmailOnlyLoginEnabled(false), false);
    assert.equal(resolveEmailOnlyLoginEnabled(undefined), false);
  });

  it("enables email-only login when whitelist mode is active", () => {
    assert.equal(resolveEmailOnlyLoginEnabled(true), true);
  });
});
