import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapProphetGameDetailToMatch } from "@/lib/market/prophet-game-detail-mapper";
import {
  mergeMoneylineFromGammaEvent,
  syncFixtureMoneylineGroup,
} from "@/lib/market/merge-game-trading-metadata";
import type { GammaEventRecord } from "@/lib/market/polymarket-gamma";
import type { ProphetPolyMarketGameDetail } from "@/types/prophet-api";

const uclGammaEvent: GammaEventRecord = {
  slug: "ucl-psg-ars-2026-05-30",
  title: "Paris Saint-Germain FC vs. Arsenal FC",
  markets: [
    {
      question: "Will Paris Saint-Germain FC win on 2026-05-30?",
      outcomePrices: '["0.415", "0.585"]',
      outcomes: '["Yes", "No"]',
      clobTokenIds:
        '["11111111111111111111111111111111111111111111111111111111111111111111111111111111", "22222222222222222222222222222222222222222222222222222222222222222222222222222222"]',
      conditionId: "0xhome",
      acceptingOrders: true,
    },
    {
      question: "Will Paris Saint-Germain FC vs. Arsenal FC end in a draw?",
      outcomePrices: '["0.295", "0.705"]',
      outcomes: '["Yes", "No"]',
      clobTokenIds:
        '["33333333333333333333333333333333333333333333333333333333333333333333333333333333", "44444444444444444444444444444444444444444444444444444444444444444444444444444444"]',
      conditionId: "0xdraw",
      acceptingOrders: true,
    },
    {
      question: "Will Arsenal FC win on 2026-05-30?",
      outcomePrices: '["0.305", "0.695"]',
      outcomes: '["Yes", "No"]',
      clobTokenIds:
        '["55555555555555555555555555555555555555555555555555555555555555555555555555555555", "66666666666666666666666666666666666666666666666666666666666666666666666666666666"]',
      conditionId: "0xaway",
      acceptingOrders: true,
    },
  ],
};

describe("merge-game-trading-metadata", () => {
  it("merges gamma moneyline tokens and syncs fixture moneyline group", () => {
    const detail: ProphetPolyMarketGameDetail = {
      slug: "ucl-psg-ars-2026-05-30",
      title: "Paris Saint-Germain FC vs. Arsenal FC",
      teams: [{ name: "Paris Saint-Germain FC" }, { name: "Arsenal FC" }],
      markets: [
        {
          slug: "ucl-psg-ars-2026-05-30-psg",
          outcomePrices: '["0.415", "0.585"]',
          outcomes: '["Yes", "No"]',
        },
        {
          slug: "ucl-psg-ars-2026-05-30-draw",
          outcomePrices: '["0.295", "0.705"]',
          outcomes: '["Yes", "No"]',
        },
        {
          slug: "ucl-psg-ars-2026-05-30-ars",
          outcomePrices: '["0.305", "0.695"]',
          outcomes: '["Yes", "No"]',
        },
      ],
      events: [],
    };

    const baseMatch = mapProphetGameDetailToMatch(detail);

    assert.ok(baseMatch);
    assert.equal(baseMatch?.polymarket?.moneyline.outcomes[0]?.tokenId, undefined);

    const merged = mergeMoneylineFromGammaEvent(baseMatch!, uclGammaEvent);
    const moneylineGroup = merged.polymarket?.fixtureMarkets?.lines.find(
      (group) => group.type === "moneyline",
    );

    assert.equal(merged.polymarket?.moneyline.outcomes.length, 3);
    assert.ok(
      merged.polymarket?.moneyline.outcomes.every((outcome) => Boolean(outcome.tokenId)),
    );
    assert.equal(moneylineGroup?.outcomes.length, 3);
    assert.ok(moneylineGroup?.outcomes.every((outcome) => Boolean(outcome.tokenId)));
  });

  it("syncFixtureMoneylineGroup preserves non-moneyline fixture lines", () => {
    const detail: ProphetPolyMarketGameDetail = {
      slug: "fifwc-mex-rsa-2026-06-11",
      title: "Mexico vs. South Africa",
      teams: [{ name: "Mexico" }, { name: "South Africa" }],
      markets: [
        {
          slug: "fifwc-mex-rsa-2026-06-11-mex",
          outcomePrices: '["0.665", "0.335"]',
          outcomes: '["Yes", "No"]',
        },
        {
          slug: "fifwc-mex-rsa-2026-06-11-draw",
          outcomePrices: '["0.225", "0.775"]',
          outcomes: '["Yes", "No"]',
        },
        {
          slug: "fifwc-mex-rsa-2026-06-11-rsa",
          outcomePrices: '["0.125", "0.875"]',
          outcomes: '["Yes", "No"]',
        },
      ],
      events: [],
    };

    let match = mapProphetGameDetailToMatch(detail);

    assert.ok(match);
    match = {
      ...match!,
      polymarket: {
        ...match!.polymarket!,
        fixtureMarkets: {
          lines: [
            ...(match!.polymarket!.fixtureMarkets?.lines ?? []),
            {
              type: "spread",
              title: "Spreads",
              volume: 100,
              outcomes: [],
            },
          ],
          exactScores: match!.polymarket!.fixtureMarkets?.exactScores ?? [],
          halftime: match!.polymarket!.fixtureMarkets?.halftime ?? [],
        },
      },
    };

    match = syncFixtureMoneylineGroup(match);
    const lineTypes = match.polymarket?.fixtureMarkets?.lines.map((group) => group.type);

    assert.deepEqual(lineTypes, ["moneyline", "spread"]);
  });
});
