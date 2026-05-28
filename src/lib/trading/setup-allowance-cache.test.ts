import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  invalidateSetupAllowanceCache,
  isSetupAllowanceCacheFresh,
  SETUP_ALLOWANCE_FRESH_MS,
  withSetupAllowanceCache,
} from "@/lib/trading/setup-allowance-cache";
import type { TradingUserSession } from "@/types/market";

function baseSession(overrides: Partial<TradingUserSession> = {}): TradingUserSession {
  return {
    userId: "wallet:0xabc",
    walletAddress: "0xAbc",
    signatureType: 3,
    eligibilityStatus: "eligible",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("setup allowance cache", () => {
  it("treats fresh cached allowances as valid", () => {
    const session = withSetupAllowanceCache(
      baseSession(),
      { conditionalTokens: 1, exchange: 1, negRiskExchange: 1, negRiskAdapter: 1 },
      new Date().toISOString(),
    );

    assert.equal(isSetupAllowanceCacheFresh(session), true);
  });

  it("expires cached allowances after the TTL", () => {
    const checkedAt = new Date(Date.now() - SETUP_ALLOWANCE_FRESH_MS - 1).toISOString();
    const session = withSetupAllowanceCache(
      baseSession(),
      { conditionalTokens: 1, exchange: 1, negRiskExchange: 1, negRiskAdapter: 1 },
      checkedAt,
    );

    assert.equal(isSetupAllowanceCacheFresh(session), false);
  });

  it("clears cached allowances on invalidation", () => {
    const session = invalidateSetupAllowanceCache(
      withSetupAllowanceCache(
        baseSession(),
        { conditionalTokens: 1, exchange: 1, negRiskExchange: 1, negRiskAdapter: 1 },
        new Date().toISOString(),
      ),
    );

    assert.equal(session.setupAllowances, undefined);
    assert.equal(session.setupAllowancesCheckedAt, undefined);
    assert.equal(isSetupAllowanceCacheFresh(session), false);
  });
});
