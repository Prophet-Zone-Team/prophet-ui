import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isPackagedAppEmailOnlyLogin,
  resolveEmailOnlyLoginEnabled,
} from "@/config/auth-login";

describe("resolveEmailOnlyLoginEnabled", () => {
  it("enables email-only login for packaged production builds", () => {
    if (!isPackagedAppEmailOnlyLogin) {
      assert.equal(resolveEmailOnlyLoginEnabled(false), false);
      return;
    }

    assert.equal(resolveEmailOnlyLoginEnabled(false), true);
  });

  it("enables email-only login when whitelist mode is active", () => {
    assert.equal(resolveEmailOnlyLoginEnabled(true), true);
  });
});
