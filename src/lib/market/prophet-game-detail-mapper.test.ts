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

  it("maps LOL esports markets into flat esports cards", () => {
    const detail: ProphetPolyMarketGameDetail = {
      slug: "lol-blg-hle1-2026-07-09",
      title:
        "LoL: Bilibili Gaming vs Hanwha Life Esports (BO5) - Mid-Season Invitational Playoffs",
      teams: [
        {
          name: "Bilibili Gaming",
          ordering: "home",
        },
        {
          name: "Hanwha Life Esports",
          ordering: "away",
        },
      ],
      markets: [
        {
          slug: "lol-blg-hle1-2026-07-09",
          groupItemTitle: "Match Winner",
          outcomePrices: '["0.385", "0.615"]',
          clobTokenIds:
            '["54865409545970127818483222224309761077922946344974606824700577010363479992269", "39577055225479084916752164627874450289163320947168445560952025705247541157415"]',
          conditionId:
            "0x487187034dadebc71441bd70c34351eb189c12a05c99220eb43be41b919e9261",
          acceptingOrders: true,
        },
        {
          slug: "lol-blg-hle1-2026-07-09-game1",
          groupItemTitle: "Game 1 Winner",
          outcomePrices: '["0.425", "0.575"]',
          clobTokenIds:
            '["34899681629975596680823272511407820643214154601485383259115476523364469117569", "92155896711226508531656306422645708487529460510087463062559535463800385306518"]',
          conditionId:
            "0x86d9c29b6bd497d00ea0bfd1341caf040bbf7e04bc603a55f0353f2594f0f17c",
          acceptingOrders: true,
        },
      ],
      events: undefined,
    };

    const match = mapProphetGameDetailToMatch(detail);

    assert.ok(match);
    assert.equal(match?.league, "Mid-Season Invitational Playoffs");
    assert.equal(match?.polymarket?.moneyline.outcomes.length, 2);
    assert.deepEqual(
      match?.polymarket?.moneyline.outcomes.map((outcome) => outcome.side),
      ["home", "away"],
    );
    assert.equal(match?.polymarket?.fixtureMarkets?.esportsMarkets?.length, 2);
    assert.ok(match?.polymarket?.fixtureMarkets?.esportsSections?.length);
    assert.equal(
      match?.polymarket?.fixtureMarkets?.esportsSections?.[0]?.id,
      "series_lines",
    );
    assert.equal(
      match?.polymarket?.fixtureMarkets?.esportsSections?.[0]?.groups[0]?.titleKey,
      "esportsMoneyline",
    );
  });
});
