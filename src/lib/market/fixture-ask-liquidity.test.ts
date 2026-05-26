import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  hasFixtureBuyAsk,
  NO_ASK_LIQUIDITY_MESSAGE,
  resolveFixtureBuyAskDisabledReason,
} from "@/lib/market/fixture-ask-liquidity";
import { buildFixtureBidOrderPreview } from "@/lib/market/game-order";

describe("fixture ask liquidity", () => {
  it("blocks buy orders when the selected token has no ask", () => {
    const reason = resolveFixtureBuyAskDisabledReason(
      { yesAsk: undefined, noAsk: 0.62 },
      "yes",
      "buy",
    );

    assert.equal(reason, NO_ASK_LIQUIDITY_MESSAGE);
    assert.equal(hasFixtureBuyAsk({ yesAsk: undefined, noAsk: 0.62 }, "yes"), false);
    assert.equal(hasFixtureBuyAsk({ yesAsk: undefined, noAsk: 0.62 }, "no"), true);
  });

  it("includes ask liquidity in fixture bid preview", () => {
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

    assert.equal(preview.canSubmitRealOrder, false);
    assert.equal(preview.disabledReason, NO_ASK_LIQUIDITY_MESSAGE);
  });
});
