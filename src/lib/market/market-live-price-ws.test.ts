import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildRtdsEventSlugFilter,
  normalizeTradePriceToYes,
  parseRtdsTradeMessage,
  resolveLiveMarketPrice,
  resolveLiveMarketProbability,
} from "@/context/market-live-price-ws";

describe("market-live-price-ws", () => {
  it("parses activity trades payload", () => {
    const parsed = parseRtdsTradeMessage({
      connection_id: "gRCl6a4iyWeIKAInnA==",
      payload: {
        asset: "83072215710101175871081563765894926731657038656927257285040774204247563097609",
        conditionId:
          "0xc34b198e91f197098da3f782c066328e199a6342e6798753de2bfa9ae568ae93",
        outcome: "Yes",
        outcomeIndex: 0,
        price: 0.061,
        eventSlug: "fifwc-esp-cvi-2026-06-15",
      },
      timestamp: 1781520280931,
      topic: "activity",
      type: "trades",
    });

    assert.deepEqual(parsed, {
      conditionId:
        "0xc34b198e91f197098da3f782c066328e199a6342e6798753de2bfa9ae568ae93",
      price: 0.061,
    });
  });

  it("normalizes No outcome trades to Yes-equivalent price", () => {
    assert.equal(
      normalizeTradePriceToYes({
        price: 0.939,
        outcome: "No",
        outcomeIndex: 1,
      }),
      0.061,
    );
  });

  it("builds compact event slug filters", () => {
    assert.equal(
      buildRtdsEventSlugFilter("fifwc-esp-cvi-2026-06-15"),
      '{"event_slug":"fifwc-esp-cvi-2026-06-15"}',
    );
  });

  it("falls back when conditionId is missing from store", () => {
    assert.equal(
      resolveLiveMarketPrice("0xc34b198e91f197098da3f782c066328e199a6342e6798753de2bfa9ae568ae93", 0.05, {}),
      0.05,
    );
    assert.equal(
      resolveLiveMarketProbability(
        "0xc34b198e91f197098da3f782c066328e199a6342e6798753de2bfa9ae568ae93",
        5,
        {
          "0xc34b198e91f197098da3f782c066328e199a6342e6798753de2bfa9ae568ae93": 0.061,
        },
      ),
      6.1,
    );
  });
});
