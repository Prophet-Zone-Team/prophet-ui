import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  hasFixtureBuyAsk,
  isFixtureOutcomeSelectable,
  mergeFixtureOutcomeLiveAsks,
  NO_ASK_LIQUIDITY_MESSAGE,
  resolveFixtureBuyAskDisabledReason,
  resolveOutcomeLiveAsksFromTokenPrices,
} from "@/lib/market/fixture-ask-liquidity";
import type { FixtureMarketOutcome } from "@/types/market";
import { buildFixtureBidOrderPreview } from "@/lib/market/game-order";

describe("fixture ask liquidity", () => {
  it("allows selecting outcomes with snapshot display prices but no live ask", () => {
    assert.equal(
      isFixtureOutcomeSelectable(
        {
          tokenId: "yes-token",
          probability: 55,
          price: 0.55,
        },
        "yes",
      ),
      true,
    );
    assert.equal(hasFixtureBuyAsk({ yesAsk: undefined, noAsk: 0.62 }, "yes"), false);
  });

  it("blocks buy orders when the selected token has no ask or display price", () => {
    const reason = resolveFixtureBuyAskDisabledReason(
      { yesAsk: undefined, noAsk: 0.62 },
      "yes",
      "buy",
    );

    assert.equal(reason, NO_ASK_LIQUIDITY_MESSAGE);
    assert.equal(hasFixtureBuyAsk({ yesAsk: undefined, noAsk: 0.62 }, "yes"), false);
    assert.equal(hasFixtureBuyAsk({ yesAsk: undefined, noAsk: 0.62 }, "no"), true);
  });

  it("allows limit buy orders without live ask when snapshot price exists", () => {
    const reason = resolveFixtureBuyAskDisabledReason(
      { yesAsk: undefined, noAsk: 0.62, probability: 38, price: 0.38 },
      "yes",
      "buy",
      "GTC",
    );

    assert.equal(reason, undefined);
  });

  it("allows market buy orders with snapshot display price but no live ask", () => {
    const preview = buildFixtureBidOrderPreview({
      outcome: {
        id: "spread:test:yes",
        marketType: "spread",
        category: "lines",
        label: "MEX +2.5",
        side: "home",
        probability: 15,
        price: 0.15,
        tokenId: "yes-token",
        noTokenId: "no-token",
        yesAsk: undefined,
        noAsk: 0.85,
      },
      acceptingOrders: true,
      binarySide: "yes",
      tradeSide: "buy",
      amount: 1,
      limitPrice: 0.15,
      orderType: "FAK",
    });

    assert.equal(preview.canSubmitRealOrder, true);
    assert.equal(preview.disabledReason, undefined);
  });

  it("keeps snapshot asks when live asks are missing or invalid", () => {
    const snapshot: FixtureMarketOutcome = {
      id: "moneyline:home",
      marketType: "moneyline",
      category: "lines",
      label: "Home",
      side: "home",
      probability: 55,
      price: 0.55,
      tokenId: "yes-token",
      yesAsk: 0.55,
      noAsk: 0.48,
    };

    const merged = mergeFixtureOutcomeLiveAsks(snapshot, {
      yesAsk: undefined,
      noAsk: undefined,
    });

    assert.equal(merged.yesAsk, 0.55);
    assert.equal(merged.noAsk, 0.48);
    assert.equal(hasFixtureBuyAsk(merged, "yes"), true);
  });

  it("applies valid live asks over snapshot values", () => {
    const snapshot: FixtureMarketOutcome = {
      id: "moneyline:home",
      marketType: "moneyline",
      category: "lines",
      label: "Home",
      side: "home",
      probability: 55,
      price: 0.55,
      tokenId: "yes-token",
      yesAsk: 0.55,
      noAsk: 0.48,
    };

    const merged = mergeFixtureOutcomeLiveAsks(snapshot, {
      yesAsk: 0.58,
      noAsk: 0.45,
    });

    assert.equal(merged.yesAsk, 0.58);
    assert.equal(merged.noAsk, 0.45);
  });

  it("maps token prices to the matching outcome token ids", () => {
    const homeAsks = resolveOutcomeLiveAsksFromTokenPrices(
      { tokenId: "home-token" },
      { "home-token": { bestAsk: 0.61, bestBid: 0.59 } },
    );
    const awayAsks = resolveOutcomeLiveAsksFromTokenPrices(
      { tokenId: "away-token" },
      { "away-token": { bestAsk: 0.42, bestBid: 0.4 } },
    );

    assert.equal(homeAsks?.yesAsk, 0.61);
    assert.equal(awayAsks?.yesAsk, 0.42);
  });
});
