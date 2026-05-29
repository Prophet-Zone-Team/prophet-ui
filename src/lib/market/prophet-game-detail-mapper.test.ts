import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  mapProphetGameDetailToMatch,
  parseProphetGameEvents,
  resolveProphetGameSiblingEventSlugs,
} from "@/lib/market/prophet-game-detail-mapper";
import type { ProphetPolyMarketGameDetail } from "@/types/prophet-api";

const siblingExactScoreEvent = {
  id: "507695",
  slug: "fifwc-mex-rsa-2026-06-11-exact-score",
  title: "Mexico vs. South Africa - Exact Score",
  markets: [
    {
      slug: "fifwc-mex-rsa-2026-06-11-exact-score-0-0",
      groupItemTitle: "Exact Score: 0-0",
      sportsMarketType: "soccer_exact_score",
      question: "Exact Score: Mexico 0 - 0 South Africa?",
      outcomePrices: '["0.085", "0.915"]',
      outcomes: '["Yes", "No"]',
      clobTokenIds:
        '["59363654735277633744123339155239797497814376834567741525259220139001079148212", "75079679152498738960177780694727737033623822914938145535200106699264471657902"]',
      conditionId:
        "0x014a6df6025f17949f5f3de2ecf1b24787315d73d7af627069e8442efb766c1b",
      acceptingOrders: true,
      volume: "399.30832799999996",
    },
  ],
};

describe("prophet-game-detail-mapper", () => {
  it("parses JSON-string events from prophet game detail", () => {
    const events = parseProphetGameEvents([
      JSON.stringify(siblingExactScoreEvent),
    ]);

    assert.equal(events.length, 1);
    assert.equal(events[0]?.slug, siblingExactScoreEvent.slug);
    assert.equal(events[0]?.markets?.length, 1);
  });

  it("resolves sibling event slugs for lazy trading metadata", () => {
    const detail: ProphetPolyMarketGameDetail = {
      slug: "fifwc-mex-rsa-2026-06-11",
      title: "Mexico vs. South Africa",
      events: [
        JSON.stringify(siblingExactScoreEvent),
        JSON.stringify({
          slug: "fifwc-mex-rsa-2026-06-11-halftime-result",
          markets: [],
        }),
        JSON.stringify({
          slug: "fifwc-mex-rsa-2026-06-11-more-markets",
          markets: [],
        }),
      ],
    };

    assert.deepEqual(resolveProphetGameSiblingEventSlugs(detail), {
      main: "fifwc-mex-rsa-2026-06-11",
      exactScore: "fifwc-mex-rsa-2026-06-11-exact-score",
      halftime: "fifwc-mex-rsa-2026-06-11-halftime-result",
      moreMarkets: "fifwc-mex-rsa-2026-06-11-more-markets",
    });
  });

  it("maps detail fixture markets from parsed events", () => {
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
      events: [JSON.stringify(siblingExactScoreEvent)],
    };

    const match = mapProphetGameDetailToMatch(detail);

    assert.ok(match);
    assert.equal(match?.polymarket?.moneyline.outcomes.length, 3);
    assert.equal(match?.polymarket?.moneyline.outcomes[0]?.side, "home");
    assert.ok((match?.polymarket?.moneyline.outcomes[0]?.probability ?? 0) > 0);
    assert.equal(
      match?.polymarket?.fixtureMarkets?.lines.find((group) => group.type === "moneyline")
        ?.outcomes.length,
      3,
    );
    assert.equal(match?.polymarket?.fixtureMarkets?.exactScores.length, 1);
    assert.equal(
      match?.polymarket?.fixtureMarkets?.exactScores[0]?.tokenId,
      "59363654735277633744123339155239797497814376834567741525259220139001079148212",
    );
    assert.equal(match?.odds?.outcomes.length, 3);
  });

  it("maps UCL detail markets into display moneyline outcomes", () => {
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

    const match = mapProphetGameDetailToMatch(detail);

    assert.ok(match);
    assert.equal(match?.polymarket?.moneyline.outcomes.length, 3);
    assert.deepEqual(
      match?.polymarket?.moneyline.outcomes.map((outcome) => outcome.side),
      ["home", "draw", "away"],
    );
    assert.ok(
      match?.polymarket?.moneyline.outcomes.every((outcome) => outcome.probability > 0),
    );
    assert.equal(
      match?.polymarket?.fixtureMarkets?.lines.find((group) => group.type === "moneyline")
        ?.outcomes.length,
      3,
    );
  });
});
