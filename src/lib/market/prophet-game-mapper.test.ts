import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  mapProphetGameToMatch,
  mapProphetGamesToMatches,
  parseTeamsFromTitle,
} from "@/lib/market/prophet-game-mapper";
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

  it("builds odds when markets are provided", () => {
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
});
