import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  mapProphetTrackToCardProps,
  mapProphetTracksToCardProps
} from "@/lib/tracks/prophet-track-mapper";
import type { ProphetUserTrackItem } from "@/types/prophet-api";

describe("prophet-track-mapper", () => {
  it("maps team track fields to TrackCard props", () => {
    const item: ProphetUserTrackItem = {
      slug: "brazil",
      team_name: "Brazil",
      probobility: "18.2",
      oneDayPriceChange: "0.36",
      volume: "27800000",
      team: { code: "BRA", name: "Brazil" }
    };

    const card = mapProphetTrackToCardProps(item);

    assert.ok(card);
    assert.equal(card.variant, undefined);
    assert.equal(card.snapshot.team.id, "brazil");
    assert.equal(card.snapshot.market.probability, 18.2);
    assert.equal(card.snapshot.market.change24h, 0.36);
    assert.equal(card.snapshot.market.volume, 27_800_000);
    assert.deepEqual(card.signals, { count: 0 });
    assert.deepEqual(card.signalItems, []);
  });

  it("maps game track fields to GameTrackCard props", () => {
    const item: ProphetUserTrackItem = {
      category: "game",
      slug: "fifwc-mex-rsa-2026-06-11",
      team_name: "Mexico,South Africa",
      volume: "32383.844867000007",
      probobility: "",
      goals: null,
      markets: [
        {
          slug: "fifwc-mex-rsa-2026-06-11-mex",
          groupItemTitle: "Mexico",
          volume: "18705.532434000004",
          outcomePrices: '["0.665", "0.335"]',
          oneDayPriceChange: "0",
          oneHourPriceChange: "0",
          oneWeekPriceChange: "0",
          oneMonthPriceChange: "0.005"
        }
      ]
    };

    const card = mapProphetTrackToCardProps(item);

    assert.ok(card);
    assert.equal(card.variant, "game");
    assert.equal(card.match.id, "fifwc-mex-rsa-2026-06-11");
    assert.equal(card.homeTeam.code, "MEX");
    assert.equal(card.awayTeam.code, "RSA");
    assert.equal(card.probability, 66.5);
    assert.equal(card.probabilityTeamCode, "MEX");
    assert.equal(card.volume, 32383.844867000007);
  });

  it("skips unresolvable teams and game tracks without fixture sides", () => {
    const unknownTeam: ProphetUserTrackItem = {
      slug: "unknown-team-xyz",
      team_name: "Not A Real Team"
    };
    const unknownGame: ProphetUserTrackItem = {
      category: "game",
      slug: "unknown-game",
      team_name: "Not A Real Team,Also Unknown"
    };

    assert.equal(mapProphetTrackToCardProps(unknownTeam), undefined);
    assert.equal(mapProphetTrackToCardProps(unknownGame), undefined);
    assert.deepEqual(
      mapProphetTracksToCardProps([unknownTeam, unknownGame]),
      []
    );
  });

  it("maps multiple valid team tracks", () => {
    const items: ProphetUserTrackItem[] = [
      { team: { code: "ESP", name: "Spain" }, probobility: "10" },
      { team: { code: "FRA", name: "France" }, probobility: "12" }
    ];

    const cards = mapProphetTracksToCardProps(items);

    assert.equal(cards.length, 2);
    assert.equal(cards[0].variant, undefined);
    assert.equal(cards[1].variant, undefined);
    assert.equal(cards[0].snapshot.team.id, "spain");
    assert.equal(cards[1].snapshot.team.id, "france");
  });
});
