import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildStaticGroupSnapshots,
  mapGroupWinnerEventToSnapshots,
} from "@/lib/market/map-group-winner-event";
import type { GammaEventRecord } from "@/lib/market/polymarket-gamma";

describe("map-group-winner-event", () => {
  it("merges South Korea gamma data onto the Korea Republic group row", () => {
    const staticSnapshots = buildStaticGroupSnapshots("A");
    const koreaRow = staticSnapshots.find((snapshot) => snapshot.team.code === "KOR");

    assert.ok(koreaRow);
    assert.equal(koreaRow.team.id, "south-korea");

    const event: GammaEventRecord = {
      slug: "world-cup-group-a-winner",
      markets: [
        {
          groupItemTitle: "South Korea",
          outcomePrices: '["0.335", "0.665"]',
          outcomes: '["Yes", "No"]',
          clobTokenIds:
            '["87351907526943178422029741800130120652110413212978205825674325623212966790505", "78670562145011339714199048291487309804972837282336953106976349058344426268732"]',
          acceptingOrders: true,
          orderPriceMinTickSize: 0.01,
          orderMinSize: 5,
          volumeNum: 138_026,
          oneDayPriceChange: 0.012,
          liquidity: 12_500,
        },
      ],
    };

    const snapshots = mapGroupWinnerEventToSnapshots(event, "A");
    const mergedKorea = snapshots.find((snapshot) => snapshot.team.code === "KOR");

    assert.ok(mergedKorea);
    assert.equal(mergedKorea.team.id, "south-korea");
    assert.equal(mergedKorea.market.probability, 33.5);
    assert.equal(mergedKorea.market.change24h, 1.2);
    assert.equal(mergedKorea.market.liquidity, 12_500);
    assert.equal(mergedKorea.market.polymarket?.tokens?.yes?.price, 0.335);
    assert.equal(mergedKorea.market.polymarket?.tokens?.no?.price, 0.665);
  });
});
