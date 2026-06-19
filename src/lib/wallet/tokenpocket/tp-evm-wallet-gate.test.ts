import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateTpNonEvmWalletActive } from "@/lib/wallet/tokenpocket/tp-evm-wallet-gate";

describe("evaluateTpNonEvmWalletActive", () => {
  it("returns false when not in TokenPocket", () => {
    assert.equal(evaluateTpNonEvmWalletActive(false, "tron", true), false);
  });

  it("returns false when current blockchain is matic", () => {
    assert.equal(evaluateTpNonEvmWalletActive(true, "matic", true), false);
  });

  it("returns true when current blockchain is tron", () => {
    assert.equal(evaluateTpNonEvmWalletActive(true, "tron", false), true);
  });

  it("returns true when current blockchain is solana", () => {
    assert.equal(evaluateTpNonEvmWalletActive(true, "solana", false), true);
  });

  it("falls back to probe when SDK blockchain is unavailable", () => {
    assert.equal(evaluateTpNonEvmWalletActive(true, undefined, true), true);
    assert.equal(evaluateTpNonEvmWalletActive(true, undefined, false), false);
  });

  it("returns false for unknown non-polygon evm blockchain labels", () => {
    assert.equal(evaluateTpNonEvmWalletActive(true, "eth", false), false);
  });
});
