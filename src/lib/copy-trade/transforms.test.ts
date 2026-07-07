import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formToApiTarget,
  targetFormToProfilePatch,
  type CopyTargetForm
} from "@/lib/copy-trade/transforms";

const SAMPLE_FORM: CopyTargetForm = {
  wallet: "0xabc123",
  enabled: true,
  dryRun: false,
  buyEnabled: true,
  sellEnabled: false,
  buyTakerOnly: true,
  sellTakerOnly: true,
  sizeMode: "ratio",
  orderType: "FAK",
  ratio: 0.15,
  minPrice: 0.2,
  maxPrice: 0.95,
  maxSlippage: 0.03,
  maxUSDPerTrade: 10,
  maxUSDPerMarket: 50,
  maxUSDPerHour: 200,
  maxUSDTotal: 500,
  allowedConditions: [],
  blockedConditions: []
};

describe("targetFormToProfilePatch", () => {
  it("maps shared trading fields consistently with formToApiTarget", () => {
    const profilePatch = targetFormToProfilePatch(SAMPLE_FORM, { enabled: true });
    const apiTarget = formToApiTarget(SAMPLE_FORM);

    assert.equal(profilePatch.enabled, true);
    assert.equal(profilePatch.dry_run, apiTarget.dry_run);
    assert.equal(profilePatch.buy_enabled, apiTarget.buy_enabled);
    assert.equal(profilePatch.sell_enabled, apiTarget.sell_enabled);
    assert.equal(profilePatch.taker_only, apiTarget.taker_only);
    assert.equal(profilePatch.buy_taker_only, apiTarget.buy_taker_only);
    assert.equal(profilePatch.sell_taker_only, apiTarget.sell_taker_only);
    assert.equal(profilePatch.size_mode, apiTarget.size_mode);
    assert.equal(profilePatch.ratio, apiTarget.ratio);
    assert.equal(profilePatch.order_type, apiTarget.order_type);
    assert.equal(profilePatch.min_price, apiTarget.min_price);
    assert.equal(profilePatch.max_price, apiTarget.max_price);
    assert.equal(profilePatch.max_slippage, apiTarget.max_slippage);
    assert.equal(profilePatch.max_usd_per_trade, apiTarget.max_usd_per_trade);
    assert.equal(
      profilePatch.max_usd_per_market,
      apiTarget.max_usd_per_market
    );
    assert.equal(profilePatch.max_usd_per_hour, apiTarget.max_usd_per_hour);
    assert.equal(profilePatch.max_usd_total, apiTarget.max_usd_total);
  });

  it("uses modal defaults for live copy profile sync", () => {
    const profilePatch = targetFormToProfilePatch(SAMPLE_FORM);

    assert.equal(profilePatch.max_usd_per_trade, 10);
    assert.equal(profilePatch.max_usd_per_market, 50);
    assert.equal(profilePatch.max_usd_per_hour, 200);
    assert.equal(profilePatch.max_usd_total, 500);
    assert.equal(profilePatch.min_price, 0.2);
    assert.equal(profilePatch.max_price, 0.95);
    assert.equal(profilePatch.max_slippage, 0.03);
    assert.equal(profilePatch.dry_run, false);
    assert.equal(profilePatch.buy_taker_only, true);
    assert.equal(profilePatch.sell_taker_only, true);
    assert.equal(profilePatch.order_type, "FAK");
  });
});
