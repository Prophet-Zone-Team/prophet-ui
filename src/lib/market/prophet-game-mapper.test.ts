import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  extractFixtureTeamAbbreviations,
  mapProphetGameToMatch,
  mapProphetGamesToMatches,
  parseTeamsFromTitle,
} from "@/lib/market/prophet-game-mapper";
import { parseMatchOutcomeOdds } from "@/lib/market/match-outcome-odds";
import { buildGameMarketSnapshot } from "@/lib/market/game-market-snapshot";
import { buildGameBidOrderPreview } from "@/lib/market/game-order";
import type { ProphetPolyMarketGameItem } from "@/types/prophet-api";

describe("prophet-game-mapper", () => {
  it("maps slug, title sides, volume, and kickoff from prophet game item", () => {
    const game: ProphetPolyMarketGameItem = {
      event_id: "351715",
      slug: "fifwc-mex-rsa-2026-06-11",
      title: "Mexico vs. South Africa",
      start_time: "2026-06-11T19:00:00Z",
      volume: "22374.91",
      active: 1,
      closed: 0,
      markets: null,
      teams: null,
      status: 0,
    };

    const match = mapProphetGameToMatch(game);

    assert.ok(match);
    assert.equal(match.id, "fifwc-mex-rsa-2026-06-11");
    assert.equal(match.homeDisplayName, "Mexico");
    assert.equal(match.awayDisplayName, "South Africa");
    assert.equal(match.homeApiTeamId, undefined);
    assert.equal(match.awayApiTeamId, undefined);
    assert.equal(match.homePolymarketTeamId, undefined);
    assert.equal(match.awayPolymarketTeamId, undefined);
    assert.equal(match.kickoffAt, "2026-06-11T19:00:00Z");
    assert.equal(match.status, "scheduled");
    assert.equal(match.polymarket?.volume, 22374.91);
    assert.equal(match.polymarket?.slug, "fifwc-mex-rsa-2026-06-11");
    assert.equal(match.odds, undefined);
  });

  it("resolves home/away by ordering and maps api/polymarket team ids", () => {
    const game: ProphetPolyMarketGameItem = {
      slug: "uecl-drita-floriana-2026-07-28",
      title: "Floriana vs. Drita",
      start_time: "2026-07-28T18:00:00Z",
      volume: "100",
      active: 1,
      closed: 0,
      markets: null,
      teams: [
        {
          name: "Floriana",
          ordering: "away",
          api_team_id: 4625,
          polymarket_team_id: 177742,
          logo: "https://example.com/floriana.png"
        },
        {
          name: "Drita",
          ordering: "home",
          api_team_id: 14281,
          polymarket_team_id: 177752,
          logo: "https://example.com/drita.png"
        }
      ],
      status: 0
    };

    const match = mapProphetGameToMatch(game);

    assert.ok(match);
    assert.equal(match.homeDisplayName, "Drita");
    assert.equal(match.awayDisplayName, "Floriana");
    assert.equal(match.homeApiTeamId, 14281);
    assert.equal(match.awayApiTeamId, 4625);
    assert.equal(match.homePolymarketTeamId, 177752);
    assert.equal(match.awayPolymarketTeamId, 177742);
    assert.equal(match.homeLogoUrl, "https://example.com/drita.png");
    assert.equal(match.awayLogoUrl, "https://example.com/floriana.png");
  });

  it("skips games without slug or unparseable title", () => {
    assert.equal(mapProphetGameToMatch({ title: "Mexico vs. South Africa" }), undefined);
    assert.equal(mapProphetGameToMatch({ slug: "x", title: "Invalid title" }), undefined);
  });

  it("maps closed and cancelled status", () => {
    const finished = mapProphetGameToMatch({
      slug: "done",
      title: "A vs. B",
      closed: 1,
    });
    const cancelled = mapProphetGameToMatch({
      slug: "off",
      title: "A vs. B",
      active: 0,
    });

    assert.equal(finished?.status, "finished");
    assert.equal(cancelled?.status, "cancelled");
  });

  it("prefers teams array over title when present", () => {
    const match = mapProphetGameToMatch({
      slug: "teams-slug",
      title: "Ignored vs. Names",
      teams: [{ name: "France" }, { name: "Brazil" }],
    });

    assert.equal(match?.homeDisplayName, "France");
    assert.equal(match?.awayDisplayName, "Brazil");
  });

  it("maps team logos from teams array", () => {
    const match = mapProphetGameToMatch({
      slug: "fifwc-mex-rsa-2026-06-11",
      title: "Mexico vs. South Africa",
      teams: [
        {
          name: "Mexico",
          logo: "https://polymarket-upload.s3.us-east-2.amazonaws.com/country-flags/mx.png",
        },
        {
          name: "South Africa",
          logo: "https://polymarket-upload.s3.us-east-2.amazonaws.com/country-flags/za.png",
        },
      ],
    });

    assert.equal(match?.homeDisplayName, "Mexico");
    assert.equal(match?.awayDisplayName, "South Africa");
    assert.equal(
      match?.homeLogoUrl,
      "https://polymarket-upload.s3.us-east-2.amazonaws.com/country-flags/mx.png",
    );
    assert.equal(
      match?.awayLogoUrl,
      "https://polymarket-upload.s3.us-east-2.amazonaws.com/country-flags/za.png",
    );
  });

  it("builds odds from outcomePrices on separate moneyline markets", () => {
    const match = mapProphetGameToMatch({
      slug: "fifwc-mex-rsa-2026-06-11",
      title: "Mexico vs. South Africa",
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
    });

    assert.equal(match?.odds?.outcomes.length, 3);
    assert.equal(match?.odds?.outcomes[0]?.label, "Mexico");
    assert.equal(match?.odds?.outcomes[0]?.impliedProbability, 0.665);
    assert.equal(match?.odds?.outcomes[1]?.label, "Draw");
    assert.equal(match?.odds?.outcomes[1]?.impliedProbability, 0.225);
    assert.equal(match?.odds?.outcomes[2]?.label, "South Africa");
    assert.equal(match?.odds?.outcomes[2]?.impliedProbability, 0.125);
  });

  it("builds odds from legacy outcomes and prices arrays", () => {
    const match = mapProphetGameToMatch({
      slug: "with-odds",
      title: "Mexico vs. South Africa",
      markets: [
        {
          outcomes: ["Mexico", "Draw", "South Africa"],
          prices: ["0.42", "0.28", "0.30"],
        },
      ],
    });

    assert.equal(match?.odds?.outcomes.length, 3);
    assert.equal(match?.odds?.outcomes[0]?.label, "Mexico");
    assert.equal(match?.odds?.outcomes[0]?.impliedProbability, 0.42);
  });

  it("parseTeamsFromTitle handles vs. and v separators", () => {
    assert.deepEqual(parseTeamsFromTitle("Mexico vs. South Africa"), {
      homeName: "Mexico",
      awayName: "South Africa",
    });
    assert.deepEqual(parseTeamsFromTitle("Korea Republic v Czechia"), {
      homeName: "Korea Republic",
      awayName: "Czechia",
    });
  });

  it("mapProphetGamesToMatches filters invalid entries", () => {
    const matches = mapProphetGamesToMatches([
      { slug: "a", title: "A vs. B" },
      { title: "Missing slug" },
    ]);

    assert.equal(matches.length, 1);
    assert.equal(matches[0]?.id, "a");
  });

  it("maps ucl club teams without confusing national team codes", () => {
    const match = mapProphetGameToMatch({
      slug: "ucl-psg-ars-2026-05-30",
      title: "Paris Saint-Germain FC vs. Arsenal FC",
      teams: [
        { name: "Paris Saint-Germain FC" },
        { name: "Arsenal FC" },
      ],
    });

    assert.equal(match?.homeDisplayName, "Paris Saint-Germain FC");
    assert.equal(match?.awayDisplayName, "Arsenal FC");
    assert.equal(match?.homeTeamId, "paris-saint-germain-fc");
    assert.equal(match?.awayTeamId, "arsenal-fc");
  });

  it("extractFixtureTeamAbbreviations parses fifwc, ucl, and lal slugs", () => {
    assert.deepEqual(extractFixtureTeamAbbreviations("fifwc-mex-rsa-2026-06-11"), {
      homeAbbrev: "mex",
      awayAbbrev: "rsa",
    });
    assert.deepEqual(extractFixtureTeamAbbreviations("ucl-psg-ars-2026-05-30"), {
      homeAbbrev: "psg",
      awayAbbrev: "ars",
    });
    assert.deepEqual(extractFixtureTeamAbbreviations("lal-mad-mala-2026-08-19"), {
      homeAbbrev: "mad",
      awayAbbrev: "mala",
    });
    assert.deepEqual(extractFixtureTeamAbbreviations("with-odds"), {});
  });

  it("maps moneyline trading tokens from /v1/games markets", () => {
    const match = mapProphetGameToMatch({
      slug: "lal-mad-mala-2026-08-19",
      title: "Club Atlético de Madrid vs. Málaga CF",
      active: 1,
      closed: 0,
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
    });

    assert.ok(match);
    assert.equal(match.polymarket?.moneyline.acceptingOrders, true);
    assert.equal(match.polymarket?.moneyline.outcomes.length, 3);
    assert.deepEqual(
      match.polymarket?.moneyline.outcomes.map((outcome) => outcome.side),
      ["home", "draw", "away"],
    );
    assert.ok(
      match.polymarket?.moneyline.outcomes.every((outcome) => Boolean(outcome.tokenId)),
    );
    assert.equal(
      match.polymarket?.moneyline.outcomes[0]?.tokenId,
      "65764753688143016983294497100440298277585437652399725714764558979814196484842",
    );
    assert.equal(
      match.polymarket?.moneyline.outcomes[0]?.noTokenId,
      "19932614258411033232715178400246259576160922249181697150993830259893250431700",
    );
    assert.equal(
      match.polymarket?.moneyline.conditionId,
      "0x02c913fd89ec97f63af1a3b2ce975def0d13163635f451fb0c8226f867daaa00",
    );

    const snapshot = buildGameMarketSnapshot(match, []);
    const preview = buildGameBidOrderPreview({
      snapshot,
      outcomeSide: "home",
      binarySide: "yes",
      tradeSide: "buy",
      amount: 5,
      limitPrice: 0.725,
      orderType: "GTC",
    });

    assert.equal(
      snapshot.outcomes[0]?.tokenId,
      "65764753688143016983294497100440298277585437652399725714764558979814196484842",
    );
    assert.equal(preview.canSubmitRealOrder, true);
    assert.equal(preview.disabledReason, undefined);
  });

  it("builds odds from polymarket slug abbreviations that differ from fifa codes", () => {
    const match = mapProphetGameToMatch({
      slug: "fifwc-kr-cze-2026-06-11",
      title: "Korea Republic vs. Czechia",
      teams: [{ name: "Korea Republic" }, { name: "Czechia" }],
      markets: [
        {
          slug: "fifwc-kr-cze-2026-06-11-kr",
          outcomePrices: '["0.42", "0.58"]',
        },
        {
          slug: "fifwc-kr-cze-2026-06-11-draw",
          outcomePrices: '["0.28", "0.72"]',
        },
        {
          slug: "fifwc-kr-cze-2026-06-11-cze",
          outcomePrices: '["0.30", "0.70"]',
        },
      ],
    });

    assert.equal(match?.odds?.outcomes.length, 3);
    assert.equal(match?.odds?.outcomes[0]?.label, "Korea Republic");
    assert.equal(match?.odds?.outcomes[1]?.label, "Draw");
    assert.equal(match?.odds?.outcomes[2]?.label, "Czechia");

    const parsed = parseMatchOutcomeOdds(
      match!,
      match!.homeDisplayName,
      match!.awayDisplayName,
    );
    assert.equal(parsed.status, "ready");
  });

  it("maps curacao away side from fixture slug when polymarket uses kor suffix", () => {
    const match = mapProphetGameToMatch({
      slug: "fifwc-ger-kor-2026-06-14",
      title: "Germany vs. Curaçao",
      teams: [{ name: "Germany" }, { name: "Curaçao" }],
      markets: [
        {
          slug: "fifwc-ger-kor-2026-06-14-ger",
          outcomePrices: '["0.936", "0.064"]',
        },
        {
          slug: "fifwc-ger-kor-2026-06-14-kor",
          outcomePrices: '["0.023", "0.977"]',
        },
        {
          slug: "fifwc-ger-kor-2026-06-14-draw",
          outcomePrices: '["0.0445", "0.9555"]',
        },
      ],
    });

    assert.equal(match?.odds?.outcomes[1]?.label, "Curaçao");

    const parsed = parseMatchOutcomeOdds(
      match!,
      match!.homeDisplayName,
      match!.awayDisplayName,
    );
    assert.equal(parsed.status, "ready");
  });
});
