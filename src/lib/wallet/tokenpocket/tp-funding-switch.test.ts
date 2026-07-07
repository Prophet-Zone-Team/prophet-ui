import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isPrivateModeHost } from "@/config/funding";
import {
  buildTpFundingSwitchPendingMessage,
  resolveTpHostKind,
} from "@/lib/wallet/tokenpocket/tp-funding-switch";

describe("resolveTpHostKind", () => {
  it("maps private hostnames to private kind", () => {
    assert.equal(resolveTpHostKind("private-test.prophet.zone"), "private");
  });

  it("maps main hostnames to main kind", () => {
    assert.equal(resolveTpHostKind("test.prophet.zone"), "main");
    assert.equal(resolveTpHostKind("localhost"), "main");
  });
});

describe("isPrivateModeHost alignment", () => {
  it("matches resolveTpHostKind private detection", () => {
    assert.equal(isPrivateModeHost("private-test.prophet.zone"), true);
    assert.equal(resolveTpHostKind("private-test.prophet.zone"), "private");
    assert.equal(isPrivateModeHost("test.prophet.zone"), false);
    assert.equal(resolveTpHostKind("test.prophet.zone"), "main");
  });
});

describe("buildTpFundingSwitchPendingMessage", () => {
  it("includes login preservation copy on main hosts", () => {
    const message = buildTpFundingSwitchPendingMessage("solana", "main");
    assert.match(message, /login will be preserved/i);
    assert.match(message, /Solana/i);
  });

  it("uses shorter copy on private hosts", () => {
    const message = buildTpFundingSwitchPendingMessage("tron", "private");
    assert.doesNotMatch(message, /login will be preserved/i);
    assert.match(message, /Tron/i);
  });
});
