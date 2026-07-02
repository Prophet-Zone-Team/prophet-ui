import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CopyTarget } from "@/types/copy-trade-api";

import { buildTargetFormFromWalletCopy } from "./index";
import { DEFAULT_WALLET_COPY_FORM } from "./types";

const PAUSED_TARGET: CopyTarget = {
  UserID: 9,
  Wallet: "0xabc123",
  Enabled: false,
  DryRun: true,
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
  SellEnabled: false,
  AllowedConditions: ["0xcondition"],
  BlockedConditions: []
};

describe("buildTargetFormFromWalletCopy", () => {
  it("preserves enabled and dryRun for manage targets", () => {
    const form = buildTargetFormFromWalletCopy(
      PAUSED_TARGET.Wallet,
      DEFAULT_WALLET_COPY_FORM,
      PAUSED_TARGET
    );

    assert.equal(form.enabled, false);
    assert.equal(form.dryRun, true);
    assert.deepEqual(form.allowedConditions, ["0xcondition"]);
    assert.equal(form.maxUSDPerMarket, 50);
  });

  it("defaults to live copy for new targets", () => {
    const form = buildTargetFormFromWalletCopy(
      "0xabc123",
      DEFAULT_WALLET_COPY_FORM
    );

    assert.equal(form.enabled, true);
    assert.equal(form.dryRun, false);
  });
});
