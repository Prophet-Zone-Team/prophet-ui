import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { GammaMarketRecord } from "@/lib/market/polymarket-gamma";
import {
  mapEventSportsMarkets,
  moneylineOutcomeToFixtureOutcome,
  resolveDefaultFixtureOutcome,
} from "@/lib/market/fixture-markets-mapper";

function binaryMarket(input: {
  sportsMarketType: string;
  question: string;
  groupItemTitle?: string;
  conditionId: string;
  yesPrice: number;
  noPrice: number;
}): GammaMarketRecord {
  return {
    sportsMarketType: input.sportsMarketType,
    question: input.question,
    groupItemTitle: input.groupItemTitle,
    conditionId: input.conditionId,
    acceptingOrders: true,
    outcomes: '["Yes", "No"]',
    outcomePrices: `[${input.yesPrice}, ${input.noPrice}]`,
    clobTokenIds: '["yes-token", "no-token"]',
    volumeNum: 100,
  };
}

describe("mapEventSportsMarkets", () => {
  it("maps spread, total, btts, exact score, and halftime markets", () => {
    const markets: GammaMarketRecord[] = [
      binaryMarket({
        sportsMarketType: "spreads",
        groupItemTitle: "Mexico (-1.5)",
        question: "Spread market",
        conditionId: "spread-home",
        yesPrice: 0.4,
        noPrice: 0.6,
      }),
      binaryMarket({
        sportsMarketType: "spreads",
        groupItemTitle: "South Africa (-1.5)",
        question: "Spread market away",
        conditionId: "spread-away",
        yesPrice: 0.62,
        noPrice: 0.38,
      }),
      binaryMarket({
        sportsMarketType: "totals",
        groupItemTitle: "O 2.5",
        question: "Total over",
        conditionId: "total-over",
        yesPrice: 0.47,
        noPrice: 0.53,
      }),
      binaryMarket({
        sportsMarketType: "totals",
        groupItemTitle: "U 2.5",
        question: "Total under",
        conditionId: "total-under",
        yesPrice: 0.54,
        noPrice: 0.46,
      }),
      binaryMarket({
        sportsMarketType: "both_teams_to_score",
        question: "Both Teams to Score?",
        conditionId: "btts",
        yesPrice: 0.43,
        noPrice: 0.61,
      }),
      binaryMarket({
        sportsMarketType: "exact_score",
        groupItemTitle: "2-1",
        question: "Exact score 2-1",
        conditionId: "score-2-1",
        yesPrice: 0.12,
        noPrice: 0.88,
      }),
      binaryMarket({
        sportsMarketType: "first_half",
        question:
          "If Mexico wins within the first 45 minutes of regular play plus stoppage time, this market will resolve to Yes.",
        conditionId: "ht-home",
        yesPrice: 0.5,
        noPrice: 0.5,
      }),
    ];

    const moneyline = [
      moneylineOutcomeToFixtureOutcome(
        {
          side: "home",
          label: "Mexico",
          tokenId: "ml-home",
          probability: 67,
          yesAsk: 0.67,
        },
        "Mexico",
        "South Africa",
      ),
    ];

    const snapshot = mapEventSportsMarkets(
      markets,
      "Mexico",
      "South Africa",
      moneyline.map((item) => ({
        side: item.side as "home",
        label: "Mexico",
        tokenId: item.tokenId,
        probability: item.probability,
        yesAsk: item.yesAsk,
      })),
    );

    assert.equal(snapshot.lines.length, 4);
    const spreadGroup = snapshot.lines.find((group) => group.type === "spread");

    assert.equal(spreadGroup?.title, "Spreads");
    assert.deepEqual(spreadGroup?.lineOptions, [1.5, 1.5]);
    assert.equal(spreadGroup?.lineOptionKeys?.length, 2);
    assert.deepEqual(
      spreadGroup?.outcomesByLine?.["spread:spread-home"]?.map((outcome) => outcome.label),
      ["MEX -1.5", "SOU +1.5"],
    );
    assert.equal(snapshot.lines.find((group) => group.type === "total")?.defaultLine, 2.5);
    assert.equal(snapshot.exactScores[0]?.label, "2-1");
    assert.equal(snapshot.halftime[0]?.side, "home");
    assert.equal(resolveDefaultFixtureOutcome(snapshot)?.id, "moneyline:home");
  });

  it("splits Polymarket O/U total markets into over and under outcomes", () => {
    const markets: GammaMarketRecord[] = [
      binaryMarket({
        sportsMarketType: "totals",
        groupItemTitle: "O/U 2.5",
        question: "Combine to score 2 or more goals",
        conditionId: "total-ou",
        yesPrice: 0.47,
        noPrice: 0.54,
      }),
    ];

    const snapshot = mapEventSportsMarkets(markets, "Mexico", "South Africa", []);
    const totalGroup = snapshot.lines.find((group) => group.type === "total");

    assert.equal(totalGroup?.outcomes.length, 2);
    assert.deepEqual(
      totalGroup?.outcomesByLine?.["2.5"]?.map((outcome) => outcome.label),
      ["O2.5", "U2.5"],
    );
    assert.equal(totalGroup?.outcomesByLine?.["2.5"]?.[0]?.price, 0.47);
    assert.equal(totalGroup?.outcomesByLine?.["2.5"]?.[1]?.price, 0.54);
  });
});
