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

  it("maps prophet moneyline trading metadata from detail markets", () => {
    const detail: ProphetPolyMarketGameDetail = {
      slug: "ucl-psg-ars-2026-05-30",
      title: "Paris Saint-Germain FC vs. Arsenal FC",
      teams: [{ name: "Paris Saint-Germain FC" }, { name: "Arsenal FC" }],
      markets: [
        {
          slug: "ucl-psg-ars-2026-05-30-psg",
          groupItemTitle: "Paris Saint-Germain FC",
          outcomePrices: '["0.415", "0.585"]',
          clobTokenIds:
            '["19239676013860700691088049092452970929374202302906885826905266414962485495014", "76390033422725593397114214723919940778301596013487841294052189304606101611064"]',
          conditionId:
            "0xfef657b2f9ed83dd3db24c61d115203e836f9967289cd3281b6b91dcd7338104",
          acceptingOrders: true,
          volume: "1251104.6988679883",
        },
        {
          slug: "ucl-psg-ars-2026-05-30-draw",
          groupItemTitle: "Draw (Paris Saint-Germain FC vs. Arsenal FC)",
          outcomePrices: '["0.295", "0.705"]',
          clobTokenIds:
            '["83851996047293978711040695609148469340176807181217450343995628690761599071382", "25680259997561378515727123004871172023405352425388257898331862126882947936333"]',
          conditionId:
            "0x163dc37103bb0af6e34d46c3b12390790c4210a3df40556620dc7ecd8a1d6d56",
          acceptingOrders: true,
        },
        {
          slug: "ucl-psg-ars-2026-05-30-ars",
          groupItemTitle: "Arsenal FC",
          outcomePrices: '["0.305", "0.695"]',
          clobTokenIds:
            '["48266155784016844137166283546442505319002353733298913457784203021568892550163", "17446494501052246971059053978588166916450543663295908526245793646282323329465"]',
          conditionId:
            "0x5dc96d5b6d416507a833231f23a08c69cd04592031519e2d225e2d9860e978cf",
          acceptingOrders: true,
        },
      ],
      events: [],
    };

    const match = mapProphetGameDetailToMatch(detail);

    assert.ok(match);
    assert.equal(match?.polymarket?.moneyline.acceptingOrders, true);
    assert.ok(
      match?.polymarket?.moneyline.outcomes.every((outcome) => Boolean(outcome.tokenId)),
    );
    assert.equal(
      match?.polymarket?.moneyline.outcomes[0]?.tokenId,
      "19239676013860700691088049092452970929374202302906885826905266414962485495014",
    );
    assert.equal(
      match?.polymarket?.moneyline.outcomes[0]?.conditionId,
      "0xfef657b2f9ed83dd3db24c61d115203e836f9967289cd3281b6b91dcd7338104",
    );
  });

  it("maps La Liga list-style markets into tradeable moneyline outcomes", () => {
    const detail: ProphetPolyMarketGameDetail = {
      slug: "lal-mad-mala-2026-08-19",
      title: "Club Atlético de Madrid vs. Málaga CF",
      teams: [
        { name: "Club Atlético de Madrid", ordering: "home" },
        { name: "Málaga CF", ordering: "away" },
      ],
      markets: [
        {
          slug: "lal-mad-mala-2026-08-19-mad",
          groupItemTitle: "Club Atlético de Madrid",
          outcomePrices: '["0.725", "0.275"]',
          clobTokenIds:
            '["65764753688143016983294497100440298277585437652399725714764558979814196484842", "19932614258411033232715178400246259576160922249181697150993830259893250431700"]',
          conditionId:
            "0x02c913fd89ec97f63af1a3b2ce975def0d13163635f451fb0c8226f867daaa00",
          acceptingOrders: true,
        },
        {
          slug: "lal-mad-mala-2026-08-19-draw",
          groupItemTitle: "Draw (Club Atlético de Madrid vs. Málaga CF)",
          outcomePrices: '["0.185", "0.815"]',
          clobTokenIds:
            '["105339803239391297429498994429284203707450508078120434797395677949082543763496", "102291628423297704435385023709202560745151596712800432175782101596218132910750"]',
          conditionId:
            "0x5eb6a7f6e789ca62b01c90d48028a84b27e517fae201d43996976c6230c7afc1",
          acceptingOrders: true,
        },
        {
          slug: "lal-mad-mala-2026-08-19-mala",
          groupItemTitle: "Málaga CF",
          outcomePrices: '["0.085", "0.915"]',
          clobTokenIds:
            '["78762622681385252990884332280791090511455719672840183196353283577791064936623", "61670342448653283095383367969896571837606164243787626624214243321592507799673"]',
          conditionId:
            "0x3e5ad7b79195e0fb562ec9c2e27bce01936bc38dd6244802666626ca835850b6",
          acceptingOrders: true,
        },
      ],
      events: [],
    };

    const match = mapProphetGameDetailToMatch(detail);
    const moneylineGroup = match?.polymarket?.fixtureMarkets?.lines.find(
      (group) => group.type === "moneyline",
    );

    assert.ok(match);
    assert.equal(match?.polymarket?.moneyline.outcomes.length, 3);
    assert.ok(
      match?.polymarket?.moneyline.outcomes.every((outcome) => Boolean(outcome.tokenId)),
    );
    assert.equal(moneylineGroup?.outcomes.length, 3);
    assert.ok(moneylineGroup?.outcomes.every((outcome) => Boolean(outcome.tokenId)));
  });
});
