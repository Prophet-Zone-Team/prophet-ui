import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  mapGammaMarketToTeamSnapshot,
  mapWinnerEventToStorePatch,
} from "@/lib/market/winner-event-mapper";
import type { GammaEventRecord, GammaMarketRecord } from "@/lib/market/polymarket-gamma";

describe("winner-event-mapper", () => {
  it("maps groupItemTitle markets into byTeamId with fast bid metadata", () => {
    const event: GammaEventRecord = {
      volume: 1_000_000,
      markets: [
        {
          groupItemTitle: "Spain",
          outcomePrices: "[0.12, 0.88]",
          outcomes: '["Yes", "No"]',
          clobTokenIds: '["yes-spain", "no-spain"]',
          acceptingOrders: true,
          orderPriceMinTickSize: 0.01,
          orderMinSize: 5,
          volumeNum: 42_000,
          oneDayPriceChange: 0.01,
        },
        {
          groupItemTitle: "United States",
          outcomePrices: "[0.005, 0.995]",
          outcomes: '["Yes", "No"]',
          clobTokenIds: '["yes-usa", "no-usa"]',
          acceptingOrders: true,
          volumeNum: 10_000,
        },
      ],
    };

    const patch = mapWinnerEventToStorePatch(event);

    assert.equal(patch.eventVolume, 1_000_000);
    assert.equal(patch.byTeamId.spain?.probability, 12);
    assert.equal(patch.byTeamId.usa?.probability, 0.5);
    assert.equal(patch.byTeamId.spain?.polymarket?.tokens?.yes?.tokenId, "yes-spain");
    assert.equal(patch.byTeamId.usa?.volume, 10_000);
  });

  it("maps a single gamma market into TeamMarketSnapshot", () => {
    const market: GammaMarketRecord = {
      slug: "will-spain-win-the-2026-fifa-world-cup",
      groupItemTitle: "Spain",
      outcomePrices: "[0.12, 0.88]",
      outcomes: '["Yes", "No"]',
      clobTokenIds: '["yes-spain", "no-spain"]',
      acceptingOrders: true,
      orderPriceMinTickSize: 0.01,
      orderMinSize: 5,
      volumeNum: 42_000,
      volume24hr: 1_200,
      liquidity: 8_000,
      oneDayPriceChange: 0.01,
      oneWeekPriceChange: 0.02,
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const snapshot = mapGammaMarketToTeamSnapshot(market, {
      expectedSlug: "will-spain-win-the-2026-fifa-world-cup",
    });

    assert.ok(snapshot);
    assert.equal(snapshot.team.id, "spain");
    assert.equal(snapshot.market.probability, 12);
    assert.equal(snapshot.market.change24h, 1);
    assert.equal(snapshot.market.volume, 42_000);
    assert.equal(snapshot.market.volume24h, 1_200);
    assert.equal(snapshot.market.liquidity, 8_000);
    assert.equal(snapshot.market.polymarket?.tokens?.yes?.tokenId, "yes-spain");
  });

  it("returns undefined when yes token is missing", () => {
    const market: GammaMarketRecord = {
      groupItemTitle: "Spain",
      outcomePrices: "[0.12, 0.88]",
      outcomes: '["Yes", "No"]',
      clobTokenIds: "[]",
    };

    assert.equal(mapGammaMarketToTeamSnapshot(market), undefined);
  });

  it("returns undefined when slug does not match expectedSlug", () => {
    const market: GammaMarketRecord = {
      slug: "other-slug",
      groupItemTitle: "Spain",
      outcomePrices: "[0.12, 0.88]",
      outcomes: '["Yes", "No"]',
      clobTokenIds: '["yes-spain", "no-spain"]',
    };

    assert.equal(
      mapGammaMarketToTeamSnapshot(market, { expectedSlug: "will-spain-win" }),
      undefined,
    );
  });
});
