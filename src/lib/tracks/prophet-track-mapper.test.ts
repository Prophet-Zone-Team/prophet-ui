import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  mapProphetTrackToCardProps,
  mapProphetTracksToCardProps
} from "@/lib/tracks/prophet-track-mapper";
import { isTeamFastBidReady } from "@/lib/trading/run-fast-bid";
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

  it("maps team track fast bid metadata from market clobTokenIds", () => {
    const item: ProphetUserTrackItem = {
      category: "team",
      slug: "england",
      team_name: "England",
      probobility: "",
      team: { code: "ENG", name: "England" },
      markets: [
        {
          slug: "will-england-win-the-2026-fifa-world-cup-937",
          groupItemTitle: "England",
          volume: "20869249.763005793",
          outcomePrices: '["0.1115", "0.8885"]',
          clobTokenIds:
            '["115556263888245616435851357148058235707004733438163639091106356867234218207169", "77121637225348873006259930776623502125079210522997384841464684944292365296940"]',
          acceptingOrders: true,
          negRisk: true,
          conditionId:
            "0x375409bc5eeeff961e82b479caeccc20f33d15738e5bce1186d628aa3d9dfb1f",
          oneDayPriceChange: "0",
          oneWeekPriceChange: "-0.001"
        }
      ]
    };

    const card = mapProphetTrackToCardProps(item);

    assert.ok(card);
    assert.equal(
      card.snapshot.market.slug,
      "will-england-win-the-2026-fifa-world-cup-937"
    );
    assert.equal(card.snapshot.market.polymarket?.acceptingOrders, true);
    assert.equal(card.snapshot.market.polymarket?.negRisk, true);
    assert.equal(
      card.snapshot.market.polymarket?.conditionId,
      "0x375409bc5eeeff961e82b479caeccc20f33d15738e5bce1186d628aa3d9dfb1f"
    );
    assert.equal(
      card.snapshot.market.polymarket?.tokens.yes?.tokenId,
      "115556263888245616435851357148058235707004733438163639091106356867234218207169"
    );
    assert.equal(isTeamFastBidReady(card.snapshot, 10), true);
  });

  it("maps team track probability from market outcomePrices", () => {
    const item: ProphetUserTrackItem = {
      category: "team",
      slug: "brazil",
      team_name: "Brazil",
      probobility: "",
      team: { code: "BRA", name: "Brazil" },
      markets: [
        {
          slug: "2026-fifa-world-cup-winner-brazil",
          groupItemTitle: "Brazil",
          outcomePrices: '["0.182", "0.818"]',
          oneDayPriceChange: "0.36"
        }
      ]
    };

    const card = mapProphetTrackToCardProps(item);

    assert.ok(card);
    assert.equal(card.snapshot.market.probability, 18.2);
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
