import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  mapProphetTopTrackItemToCard,
  mapProphetTopTracksToAttentionCards
} from "@/lib/tracks/prophet-top-attention-mapper";
import type {
  ProphetTopTracksData,
  ProphetUserTrackItem
} from "@/types/prophet-api";

describe("prophet-top-attention-mapper", () => {
  it("maps team track to TopAttentionCard without attention", () => {
    const item: ProphetUserTrackItem = {
      category: "team",
      slug: "will-spain-win-the-2026-fifa-world-cup-963",
      team_name: "Spain",
      volume: "26903285",
      team: { code: "ESP", name: "Spain" },
      markets: [
        {
          slug: "will-spain-win-the-2026-fifa-world-cup-963",
          groupItemTitle: "Spain",
          volume: "26903285",
          outcomePrices: '["0.1695", "0.8305"]'
        }
      ]
    };

    const card = mapProphetTopTrackItemToCard(item);

    assert.ok(card);
    assert.equal(card.variant, undefined);
    assert.equal(card.snapshot?.team.name, "Spain");
    assert.equal("attention" in card, false);
    assert.ok(card.snapshot && card.snapshot.market.probability > 0);
  });

  it("maps game track with comma-separated team_name", () => {
    const item: ProphetUserTrackItem = {
      category: "game",
      slug: "fifwc-mex-rsa-2026-06-11",
      team_name: "Mexico,South Africa",
      start_time: "2026-06-11T19:00:00Z",
      volume: "100000",
      markets: [
        {
          slug: "fifwc-mex-rsa-2026-06-11-mex",
          groupItemTitle: "Mexico",
          volume: "50000",
          outcomePrices: '["0.55", "0.45"]'
        },
        {
          slug: "fifwc-mex-rsa-2026-06-11-draw",
          groupItemTitle: "Draw (Mexico vs. South Africa)",
          volume: "20000",
          outcomePrices: '["0.28", "0.72"]'
        }
      ]
    };

    const card = mapProphetTopTrackItemToCard(item);

    assert.ok(card);
    assert.equal(card.variant, "match");
    if (card.variant === "match") {
      assert.equal(card.homeTeam.name, "Mexico");
      assert.equal(card.awayTeam.name, "South Africa");
      assert.equal(card.match.id, "fifwc-mex-rsa-2026-06-11");
      assert.ok(card.probability > 0);
    }
  });

  it("maps game track with empty team_name via fixture slug", () => {
    const item: ProphetUserTrackItem = {
      category: "game",
      slug: "fifwc-usa-par-2026-06-12",
      team_name: "",
      start_time: "2026-06-13T01:00:00Z",
      volume: "75923",
      markets: [
        {
          slug: "fifwc-usa-par-2026-06-12-draw",
          groupItemTitle: "Draw (United States vs. Paraguay)",
          volume: "6673",
          outcomePrices: '["0.275", "0.725"]'
        },
        {
          slug: "fifwc-usa-par-2026-06-12-usa",
          groupItemTitle: "United States",
          volume: "59057",
          outcomePrices: '["0.485", "0.515"]'
        },
        {
          slug: "fifwc-usa-par-2026-06-12-par",
          groupItemTitle: "Paraguay",
          volume: "10192",
          outcomePrices: '["0.24", "0.76"]'
        }
      ]
    };

    const card = mapProphetTopTrackItemToCard(item);

    assert.ok(card);
    assert.equal(card.variant, "match");
    if (card.variant === "match") {
      assert.equal(card.homeTeam.id, "usa");
      assert.equal(card.awayTeam.id, "paraguay");
      assert.equal(card.probability, 48.5);
    }
  });

  it("maps top tracks category to badge label", () => {
    const item: ProphetUserTrackItem = {
      category: "Most Popular",
      slug: "will-spain-win-the-2026-fifa-world-cup-963",
      team_name: "Spain",
      volume: "26903285",
      team: { code: "ESP", name: "Spain" },
      markets: [
        {
          slug: "will-spain-win-the-2026-fifa-world-cup-963",
          groupItemTitle: "Spain",
          volume: "26903285",
          outcomePrices: '["0.1695", "0.8305"]'
        }
      ]
    };

    const card = mapProphetTopTrackItemToCard(item, "team");

    assert.ok(card);
    assert.equal(card.variant, undefined);
    if (card.variant !== "match") {
      assert.equal(card.badge, "Most Popular");
    }
  });

  it("merges teams_tracks before game_tracks", () => {
    const data: ProphetTopTracksData = {
      teams_tracks: [
        {
          category: "Highest Volume",
          slug: "brazil",
          team_name: "Brazil",
          team: { code: "BRA", name: "Brazil" },
          probobility: "10"
        }
      ],
      game_tracks: [
        {
          category: "Dark Horse",
          slug: "fifwc-mex-rsa-2026-06-11",
          team_name: "Mexico,South Africa",
          volume: "1000",
          markets: [
            {
              slug: "fifwc-mex-rsa-2026-06-11-mex",
              groupItemTitle: "Mexico",
              volume: "1000",
              outcomePrices: '["0.5", "0.5"]'
            }
          ]
        }
      ]
    };

    const cards = mapProphetTopTracksToAttentionCards(data);

    assert.equal(cards.length, 2);
    const first = cards[0];
    assert.ok(first && first.variant !== "match");
    if (first.variant !== "match") {
      assert.equal(first.snapshot.team.id, "brazil");
      assert.equal(first.badge, "Highest Volume");
    }
    const second = cards[1];
    assert.equal(second?.variant, "match");
    if (second?.variant === "match") {
      assert.equal(second.badge, "Dark Horse");
    }
  });
});
