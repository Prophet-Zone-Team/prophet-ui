import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isTradingTokenAllowanceAuthorized } from "@/lib/trading/trading-allowance-setup";

describe("isTradingTokenAllowanceAuthorized", () => {
  it("returns true when all four allowances are positive", () => {
    assert.equal(
      isTradingTokenAllowanceAuthorized({
        conditionalTokens: 1,
        exchange: 1,
        negRiskExchange: 1,
        negRiskAdapter: 1,
      }),
      true,
    );
  });

  it("returns false when negRiskAdapter is missing or zero", () => {
    assert.equal(
      isTradingTokenAllowanceAuthorized({
        conditionalTokens: 1,
        exchange: 1,
        negRiskExchange: 1,
      }),
      false,
    );
    assert.equal(
      isTradingTokenAllowanceAuthorized({
        conditionalTokens: 1,
        exchange: 1,
        negRiskExchange: 1,
        negRiskAdapter: 0,
      }),
      false,
    );
  });

  it("returns false when allowances are undefined", () => {
    assert.equal(isTradingTokenAllowanceAuthorized(undefined), false);
  });
});
