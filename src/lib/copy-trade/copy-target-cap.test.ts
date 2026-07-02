import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CopyTarget } from "@/types/copy-trade-api";

import {
  getCopyTargetTotalCapUsage,
  isCopyTargetTotalCapReached
} from "./copy-target-cap";

function makeTarget(
  overrides: Partial<CopyTarget> = {}
): CopyTarget {
  return {
    UserID: 9,
    Wallet: "0xabc123",
    Enabled: true,
    DryRun: false,
    SizeMode: "ratio",
    FixedUSD: 0,
    Ratio: 0.2,
    MaxUSDPerTrade: 10,
    MaxUSDPerMarket: 30,
    MaxUSDPerHour: 200,
    MaxUSDTotal: 500,
    UsedUSDTotal: 0,
    MinPrice: 0.2,
    MaxPrice: 0.95,
    MaxSlippage: 0.03,
    OrderType: "FAK",
    TakerOnly: true,
    BuyTakerOnly: true,
    SellTakerOnly: true,
    BuyEnabled: true,
    SellEnabled: true,
    AllowedConditions: null,
    BlockedConditions: null,
    ...overrides
  };
}

describe("isCopyTargetTotalCapReached", () => {
  it("returns false when MaxUSDTotal is zero", () => {
    assert.equal(
      isCopyTargetTotalCapReached(
        makeTarget({ MaxUSDTotal: 0, UsedUSDTotal: 1000 })
      ),
      false
    );
  });

  it("returns false when UsedUSDTotal is below MaxUSDTotal", () => {
    assert.equal(
      isCopyTargetTotalCapReached(
        makeTarget({ MaxUSDTotal: 500, UsedUSDTotal: 499.99 })
      ),
      false
    );
  });

  it("returns true when UsedUSDTotal equals MaxUSDTotal", () => {
    assert.equal(
      isCopyTargetTotalCapReached(
        makeTarget({ MaxUSDTotal: 500, UsedUSDTotal: 500 })
      ),
      true
    );
  });

  it("returns true when UsedUSDTotal exceeds MaxUSDTotal", () => {
    assert.equal(
      isCopyTargetTotalCapReached(
        makeTarget({ MaxUSDTotal: 500, UsedUSDTotal: 600 })
      ),
      true
    );
  });
});

describe("getCopyTargetTotalCapUsage", () => {
  it("returns null when MaxUSDTotal is zero", () => {
    assert.equal(
      getCopyTargetTotalCapUsage(makeTarget({ MaxUSDTotal: 0 })),
      null
    );
  });

  it("returns used and max when cap is configured", () => {
    assert.deepEqual(
      getCopyTargetTotalCapUsage(
        makeTarget({ MaxUSDTotal: 500, UsedUSDTotal: 250 })
      ),
      { used: 250, max: 500 }
    );
  });
});
