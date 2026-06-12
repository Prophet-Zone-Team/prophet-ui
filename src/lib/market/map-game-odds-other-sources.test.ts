import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapGameOddsToOtherSources } from "@/lib/market/map-game-odds-other-sources";
import type { ProphetGetGameOddsData } from "@/types/prophet-api";
import type { FixtureMarketOutcome } from "@/types/market";

function buildOutcome(
  partial: Partial<FixtureMarketOutcome> & Pick<FixtureMarketOutcome, "id" | "marketType">
): FixtureMarketOutcome {
  return {
    category: "lines",
    label: partial.label ?? "Home",
    probability: 50,
    price: 0.5,
    ...partial
  };
}

describe("map-game-odds-other-sources", () => {
  it("normalizes moneyline home odds across Home/Draw/Away", () => {
    const odds: ProphetGetGameOddsData = {
      Moneyline: [
        {
          name: "10Bet",
          bets: [
            {
              id: 1,
              name: "Match Winner",
              values: [
                { value: "Home", odd: "1.42" },
                { value: "Draw", odd: "4.20" },
                { value: "Away", odd: "8.40" }
              ]
            }
          ]
        }
      ]
    };

    const result = mapGameOddsToOtherSources({
      odds,
      tab: "moneyline",
      selectedOutcome: buildOutcome({
        id: "home",
        marketType: "moneyline",
        side: "home"
      }),
      selectedBinarySide: "yes",
      homeTeamName: "Mexico",
      awayTeamName: "South Africa"
    });

    assert.equal(result.length, 1);
    assert.equal(result[0]?.sourceName, "10Bet");
    assert.equal(result[0]?.netPercent, 66.4);
  });

  it("normalizes totals over odds for the matching line only", () => {
    const odds: ProphetGetGameOddsData = {
      Totals: [
        {
          name: "Bet365",
          bets: [
            {
              id: 5,
              name: "Goals Over/Under",
              values: [
                { value: "Over 1.5", odd: "1.40" },
                { value: "Under 1.5", odd: "3.00" },
                { value: "Over 2.5", odd: "2.20" },
                { value: "Under 2.5", odd: "1.67" }
              ]
            }
          ]
        }
      ]
    };

    const result = mapGameOddsToOtherSources({
      odds,
      tab: "totals",
      selectedOutcome: buildOutcome({
        id: "total:2.5:over",
        marketType: "total",
        side: "over",
        line: 2.5,
        label: "O 2.5"
      }),
      selectedBinarySide: "yes",
      homeTeamName: "Mexico",
      awayTeamName: "South Africa"
    });

    assert.equal(result.length, 1);
    assert.equal(result[0]?.sourceName, "Bet365");
    assert.equal(result[0]?.netPercent, 43.2);
  });

  it("matches spread odds from outcome label sign and normalizes the pair", () => {
    const odds: ProphetGetGameOddsData = {
      Spreads: [
        {
          name: "10Bet",
          bets: [
            {
              id: 4,
              name: "Asian Handicap",
              values: [
                { value: "Home -0.5", odd: "1.48" },
                { value: "Away -0.5", odd: "2.65" },
                { value: "Home -1.5", odd: "2.30" },
                { value: "Away -1.5", odd: "1.62" }
              ]
            }
          ]
        }
      ]
    };

    const result = mapGameOddsToOtherSources({
      odds,
      tab: "spreads",
      selectedOutcome: buildOutcome({
        id: "spread:abc:yes",
        marketType: "spread",
        side: "home",
        line: 0.5,
        label: "MEX -0.5"
      }),
      selectedBinarySide: "yes",
      homeTeamName: "Mexico",
      awayTeamName: "South Africa"
    });

    assert.equal(result.length, 1);
    assert.equal(result[0]?.sourceName, "10Bet");
    assert.equal(result[0]?.netPercent, 64.2);
  });

  it("returns empty when no bookmaker matches the selected outcome", () => {
    const odds: ProphetGetGameOddsData = {
      HalftimeResults: [
        {
          name: "Unibet",
          bets: [
            {
              id: 13,
              name: "First Half Winner",
              values: [
                { value: "Home", odd: "1.91" },
                { value: "Draw", odd: "2.17" }
              ]
            }
          ]
        }
      ]
    };

    const result = mapGameOddsToOtherSources({
      odds,
      tab: "halftime",
      selectedOutcome: buildOutcome({
        id: "away",
        marketType: "halftime",
        side: "away"
      }),
      selectedBinarySide: "yes",
      homeTeamName: "Mexico",
      awayTeamName: "South Africa"
    });

    assert.deepEqual(result, []);
  });

  it("normalizes exact score odds across all listed scores", () => {
    const odds: ProphetGetGameOddsData = {
      ExactScore: [
        {
          name: "10Bet",
          bets: [
            {
              id: 10,
              name: "Exact Score",
              values: [
                { value: "1:0", odd: "4.50" },
                { value: "2:0", odd: "5.00" },
                { value: "0:0", odd: "8.00" }
              ]
            }
          ]
        }
      ]
    };

    const result = mapGameOddsToOtherSources({
      odds,
      tab: "top_scores",
      selectedOutcome: buildOutcome({
        id: "score:1-0",
        marketType: "exact_score",
        category: "exactScores",
        label: "1-0"
      }),
      selectedBinarySide: "yes",
      homeTeamName: "Mexico",
      awayTeamName: "South Africa"
    });

    assert.equal(result.length, 1);
    assert.equal(result[0]?.sourceName, "10Bet");
    assert.equal(result[0]?.netPercent, 40.6);
  });

  it("derives exact score No odds as 100 minus Yes net percent", () => {
    const odds: ProphetGetGameOddsData = {
      ExactScore: [
        {
          name: "10Bet",
          bets: [
            {
              id: 10,
              name: "Exact Score",
              values: [
                { value: "1:0", odd: "4.50" },
                { value: "2:0", odd: "5.00" },
                { value: "0:0", odd: "8.00" }
              ]
            }
          ]
        }
      ]
    };

    const result = mapGameOddsToOtherSources({
      odds,
      tab: "top_scores",
      selectedOutcome: buildOutcome({
        id: "score:1-0",
        marketType: "exact_score",
        category: "exactScores",
        label: "1-0"
      }),
      selectedBinarySide: "no",
      homeTeamName: "Mexico",
      awayTeamName: "South Africa"
    });

    assert.equal(result.length, 1);
    assert.equal(result[0]?.sourceName, "10Bet");
    assert.equal(result[0]?.netPercent, 59.4);
  });
});
