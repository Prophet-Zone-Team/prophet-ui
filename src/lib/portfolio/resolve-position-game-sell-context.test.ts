import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildFixtureMarketsSnapshot } from "@/lib/market/build-fixture-markets-snapshot";
import { buildGameMarketSnapshot } from "@/lib/market/game-market-snapshot";
import { mapProphetGameDetailToMatch } from "@/lib/market/prophet-game-detail-mapper";
import { resolvePositionGameSellContext } from "@/lib/portfolio/resolve-position-game-sell-context";
import type { ProphetPolyMarketGameDetail } from "@/types/prophet-api";
import type {
  GameFixtureMarketsSnapshot,
  GameMarketSnapshot,
  UserPositionRecord
} from "@/types/market";

const DRAW_YES_TOKEN =
  "57758150342248571718249486268138185398900253853342685989098017144739133658331";
const DRAW_NO_TOKEN =
  "42839682021848816210036219597625611829935043960468507671703547149303936126926";
const DRAW_CONDITION_ID =
  "0x6cfee4685c777509141c5f16dfee1f62011819fb7a8a8f88b701017e8e4fe1e7";

function buildLiechtensteinCyprusContext(): {
  gameSnapshot: GameMarketSnapshot;
  fixtureMarkets: GameFixtureMarketsSnapshot;
} {
  const detail: ProphetPolyMarketGameDetail = {
    slug: "fif-lie-cyp-2026-06-07",
    title: "Liechtenstein vs. Cyprus",
    teams: [{ name: "Liechtenstein" }, { name: "Cyprus" }],
    markets: [
      {
        slug: "fif-lie-cyp-2026-06-07-lie",
        groupItemTitle: "Liechtenstein",
        outcomePrices: '["0.125", "0.875"]',
        clobTokenIds:
          '["11111111111111111111111111111111111111111111111111111111111111111111", "22222222222222222222222222222222222222222222222222222222222222222222"]',
        conditionId:
          "0x1111111111111111111111111111111111111111111111111111111111111111",
        acceptingOrders: true
      },
      {
        slug: "fif-lie-cyp-2026-06-07-draw",
        groupItemTitle: "Draw (Liechtenstein vs. Cyprus)",
        outcomePrices: '["0.165", "0.835"]',
        clobTokenIds: `["${DRAW_YES_TOKEN}", "${DRAW_NO_TOKEN}"]`,
        conditionId: DRAW_CONDITION_ID,
        acceptingOrders: true
      },
      {
        slug: "fif-lie-cyp-2026-06-07-cyp",
        groupItemTitle: "Cyprus",
        outcomePrices: '["0.710", "0.290"]',
        clobTokenIds:
          '["33333333333333333333333333333333333333333333333333333333333333333333", "44444444444444444444444444444444444444444444444444444444444444444444"]',
        conditionId:
          "0x3333333333333333333333333333333333333333333333333333333333333333",
        acceptingOrders: true
      }
    ],
    events: []
  };

  const match = mapProphetGameDetailToMatch(detail);

  assert.ok(match);

  return {
    gameSnapshot: buildGameMarketSnapshot(match, []),
    fixtureMarkets: buildFixtureMarketsSnapshot(match)
  };
}

function buildPosition(
  overrides: Partial<UserPositionRecord> = {}
): UserPositionRecord {
  return {
    proxyWallet: "0xproxy",
    asset: DRAW_YES_TOKEN,
    conditionId: DRAW_CONDITION_ID,
    size: 10,
    avgPrice: 0.12,
    initialValue: 1.2,
    currentValue: 1.65,
    cashPnl: 0.45,
    percentPnl: 37.5,
    totalBought: 10,
    realizedPnl: 0,
    percentRealizedPnl: 0,
    curPrice: 0.165,
    redeemable: false,
    mergeable: false,
    title: "Will Liechtenstein vs. Cyprus end in a draw?",
    slug: "fif-lie-cyp-2026-06-07-draw",
    eventSlug: "fif-lie-cyp-2026-06-07",
    outcome: "Yes",
    outcomeIndex: 0,
    negativeRisk: true,
    ...overrides
  };
}

describe("resolvePositionGameSellContext", () => {
  it("matches moneyline draw position by yes token", () => {
    const { gameSnapshot, fixtureMarkets } = buildLiechtensteinCyprusContext();
    const context = resolvePositionGameSellContext(
      buildPosition(),
      gameSnapshot,
      fixtureMarkets
    );

    assert.ok(context);
    assert.equal(context.matchOutcomeSide, "draw");
    assert.equal(context.fixtureOutcome, null);
    assert.equal(context.outcomeSide, "yes");
  });

  it("matches moneyline draw position by no token", () => {
    const { gameSnapshot, fixtureMarkets } = buildLiechtensteinCyprusContext();
    const context = resolvePositionGameSellContext(
      buildPosition({
        asset: DRAW_NO_TOKEN,
        outcome: "No",
        outcomeIndex: 1
      }),
      gameSnapshot,
      fixtureMarkets
    );

    assert.ok(context);
    assert.equal(context.matchOutcomeSide, "draw");
    assert.equal(context.outcomeSide, "no");
  });

  it("matches no position from outcome label when outcome index is inconsistent", () => {
    const { gameSnapshot, fixtureMarkets } = buildLiechtensteinCyprusContext();
    const context = resolvePositionGameSellContext(
      buildPosition({
        asset: DRAW_NO_TOKEN,
        outcome: "No",
        outcomeIndex: 0,
      }),
      gameSnapshot,
      fixtureMarkets
    );

    assert.ok(context);
    assert.equal(context.outcomeSide, "no");
  });

  it("prefers asset match over shared condition id for fixture outcomes", () => {
    const { gameSnapshot, fixtureMarkets } = buildLiechtensteinCyprusContext();
    const sharedConditionId = "0xshared-team-to-advance";
    const homeToken = "home-advance-token";
    const awayToken = "away-advance-token";

    fixtureMarkets.lines.push({
      type: "team_to_advance",
      title: "Team to Advance",
      outcomes: [
        {
          id: "advance-home",
          marketType: "team_to_advance",
          category: "lines",
          label: "Liechtenstein",
          side: "home",
          probability: 12.5,
          price: 0.125,
          tokenId: homeToken,
          conditionId: sharedConditionId,
          acceptingOrders: true,
        },
        {
          id: "advance-away",
          marketType: "team_to_advance",
          category: "lines",
          label: "Cyprus",
          side: "away",
          probability: 71,
          price: 0.71,
          tokenId: awayToken,
          conditionId: sharedConditionId,
          acceptingOrders: true,
        },
      ],
    });

    const context = resolvePositionGameSellContext(
      buildPosition({
        asset: awayToken,
        conditionId: sharedConditionId,
        slug: "fif-lie-cyp-2026-06-07-team-to-advance",
        title: "Liechtenstein vs. Cyprus: Team to Advance",
        outcome: "Cyprus",
        outcomeIndex: 1,
      }),
      gameSnapshot,
      fixtureMarkets
    );

    assert.ok(context);
    assert.equal(context.fixtureOutcome?.side, "away");
    assert.equal(context.outcomeSide, "yes");
  });

  it("matches fixture market position by condition id", () => {
    const { gameSnapshot, fixtureMarkets } = buildLiechtensteinCyprusContext();
    const fixtureOutcome = {
      id: "total-2pt5-over",
      marketType: "total" as const,
      category: "lines" as const,
      label: "Over 2.5",
      side: "over" as const,
      line: 2.5,
      probability: 42,
      price: 0.42,
      tokenId: "fixture-yes-token",
      noTokenId: "fixture-no-token",
      conditionId: "0xfixture-condition"
    };

    fixtureMarkets.lines.push({
      type: "total",
      title: "Totals",
      outcomes: [fixtureOutcome]
    });

    const context = resolvePositionGameSellContext(
      buildPosition({
        asset: "fixture-yes-token",
        conditionId: "0xfixture-condition",
        slug: "fif-lie-cyp-2026-06-07-total-2pt5",
        title: "Liechtenstein vs. Cyprus: O/U 2.5",
        outcome: "Yes"
      }),
      gameSnapshot,
      fixtureMarkets
    );

    assert.ok(context);
    assert.equal(context.fixtureOutcome?.id, "total-2pt5-over");
    assert.equal(context.outcomeSide, "yes");
  });

  it("returns undefined when position does not match any outcome", () => {
    const { gameSnapshot, fixtureMarkets } = buildLiechtensteinCyprusContext();
    const context = resolvePositionGameSellContext(
      buildPosition({
        asset: "unknown-token",
        conditionId: "0xunknown"
      }),
      gameSnapshot,
      fixtureMarkets
    );

    assert.equal(context, undefined);
  });
});
