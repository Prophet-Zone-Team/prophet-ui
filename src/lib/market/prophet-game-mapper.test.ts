import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  extractFixtureTeamAbbreviations,
  mapProphetGameToMatch,
  mapProphetGamesToMatches,
  parseTeamsFromTitle,
} from "@/lib/market/prophet-game-mapper";
import { parseMatchOutcomeOdds } from "@/lib/market/match-outcome-odds";
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
    assert.equal(match.kickoffAt, "2026-06-11T19:00:00Z");
    assert.equal(match.status, "scheduled");
    assert.equal(match.polymarket?.volume, 22374.91);
    assert.equal(match.polymarket?.slug, "fifwc-mex-rsa-2026-06-11");
    assert.equal(match.odds, undefined);
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

  it("extractFixtureTeamAbbreviations parses fifwc and ucl slugs", () => {
    assert.deepEqual(extractFixtureTeamAbbreviations("fifwc-mex-rsa-2026-06-11"), {
      homeAbbrev: "mex",
      awayAbbrev: "rsa",
    });
    assert.deepEqual(extractFixtureTeamAbbreviations("ucl-psg-ars-2026-05-30"), {
      homeAbbrev: "psg",
      awayAbbrev: "ars",
    });
    assert.deepEqual(extractFixtureTeamAbbreviations("with-odds"), {});
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
