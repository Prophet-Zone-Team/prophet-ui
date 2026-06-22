import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  mapProphetComboMarketsResponse,
  mapProphetMarketToComboRecord,
} from "@/lib/combo/map-prophet-combo-markets";
import { mapComboGameToItemProps } from "@/lib/combo/map-market-to-combo-item";
import type { ProphetGetComboMarketsData } from "@/types/prophet-api";

const stagingSample: ProphetGetComboMarketsData = {
  list: [
    {
      slug: "fifwc-cze-rsa-2026-06-18",
      title: "Czechia vs. South Africa",
      image:
        "https://polymarket-upload.s3.us-east-2.amazonaws.com/soccer ball-bba4025f77.png",
      start_time: "2026-06-18T16:00:00Z",
      teams: [
        { id: 3270245, name: "Czechia", logo: "", ordering: "home" },
        { id: 3270264, name: "South Africa", logo: "", ordering: "away" },
      ],
      combo_markets: [
        "fifwc-cze-rsa-2026-06-18-draw",
        "fifwc-cze-rsa-2026-06-18-cze",
        "fifwc-cze-rsa-2026-06-18-rsa",
        "fifwc-cze-rsa-2026-06-18-exact-score-1-0",
        "fifwc-cze-rsa-2026-06-18-total-2pt5",
      ],
      markets: [
        {
          slug: "fifwc-cze-rsa-2026-06-18-draw",
          question: "Will Czechia vs. South Africa end in a draw?",
          outcomePrices: '["0.265", "0.735"]',
          positionIds: [
            "1302031158959328596181864012351689816200378008440816705951131802844602040576",
            "1302031158959328596181864012351689816200378008440816705951131802844602040577",
          ],
          conditionId:
            "0x0fac1fde9bf271efa6a8bcd382db88003f661f051ee7644c85ff96a6a4b2e57a",
        },
        {
          slug: "fifwc-cze-rsa-2026-06-18-cze",
          question: "Will Czechia win on 2026-06-18?",
          outcomePrices: '["0.525", "0.475"]',
          positionIds: [
            "1302031158959328596181864012351689816200378008440816705951131802844602040320",
            "1302031158959328596181864012351689816200378008440816705951131802844602040321",
          ],
          conditionId:
            "0x825bc4151fd9c139c4f0400c1a6f5d60cf67b2d04f12d69fd9fb5de67b13e4bc",
        },
        {
          slug: "fifwc-cze-rsa-2026-06-18-rsa",
          question: "Will South Africa win on 2026-06-18?",
          outcomePrices: '["0.205", "0.795"]',
          positionIds: [
            "1302031158959328596181864012351689816200378008440816705951131802844602040832",
            "1302031158959328596181864012351689816200378008440816705951131802844602040833",
          ],
          conditionId:
            "0x845d6997f4b60fbcf81e8cac4510bb18988efe56e0318d77e476124c9ce80ce8",
        },
        {
          slug: "fifwc-cze-rsa-2026-06-18-not-combo",
          question: "Should be filtered out",
          outcomePrices: '["0.5", "0.5"]',
          positionIds: ["5555555555555555", "6666666666666666"],
          conditionId:
            "0x3333333333333333333333333333333333333333333333333333333333333333",
        },
      ],
      events: [
        JSON.stringify({
          slug: "fifwc-cze-rsa-2026-06-18-exact-score",
          markets: [
            {
              slug: "fifwc-cze-rsa-2026-06-18-exact-score-1-0",
              question: "Will the exact score be 1-0?",
              outcomePrices: '["0.08", "0.92"]',
              positionIds: [
                "1111111111111111111111111111111111111111111111111111111111111111111",
                "2222222222222222222222222222222222222222222222222222222222222222222",
              ],
              conditionId:
                "0x1111111111111111111111111111111111111111111111111111111111111111",
            },
            {
              slug: "fifwc-cze-rsa-2026-06-18-exact-score-not-combo",
              question: "Should be filtered out from events",
              outcomePrices: '["0.5", "0.5"]',
              positionIds: ["7777777777777777", "8888888888888888"],
              conditionId:
                "0x4444444444444444444444444444444444444444444444444444444444444444",
            },
          ],
        }),
        JSON.stringify({
          slug: "fifwc-cze-rsa-2026-06-18-more-markets",
          markets: [
            {
              slug: "fifwc-cze-rsa-2026-06-18-total-2pt5",
              question: "Czechia vs. South Africa: O/U 2.5",
              outcomePrices: '["0.455", "0.545"]',
              positionIds: [
                "3333333333333333333333333333333333333333333333333333333333333333333",
                "4444444444444444444444444444444444444444444444444444444444444444444",
              ],
              conditionId:
                "0x2222222222222222222222222222222222222222222222222222222222222222",
            },
            {
              slug: "fifwc-cze-rsa-2026-06-18-more-markets-only",
              question: "Should be filtered out from events",
              outcomePrices: '["0.5", "0.5"]',
              positionIds: ["9999999999999999", "1010101010101010"],
              conditionId:
                "0x5555555555555555555555555555555555555555555555555555555555555555",
            },
          ],
        }),
      ],
    },
  ],
};

describe("mapProphetComboMarketsResponse", () => {
  it("keeps only combo_markets slugs and maps game metadata", () => {
    const mapped = mapProphetComboMarketsResponse(stagingSample);

    assert.equal(mapped.groups.length, 1);
    assert.equal(mapped.markets.length, 5);

    const group = mapped.groups[0];
    assert.equal(group.slug, "fifwc-cze-rsa-2026-06-18");
    assert.equal(group.kickoffLabel, "2026-06-18");
    assert.equal(group.homeTeam.name, "Czechia");
    assert.equal(group.awayTeam.name, "South Africa");
    assert.equal(
      group.markets.some((market) => market.slug.endsWith("not-combo")),
      false,
    );
    assert.equal(
      group.markets.some((market) =>
        market.slug.endsWith("exact-score-not-combo"),
      ),
      false,
    );
    assert.equal(
      group.markets.some((market) => market.slug.endsWith("more-markets-only")),
      false,
    );
    assert.equal(
      group.markets.some((market) => market.slug.includes("total-2pt5")),
      true,
    );
  });

  it("parses position ids and outcome prices", () => {
    const mapped = mapProphetComboMarketsResponse(stagingSample);
    const homeMarket = mapped.markets.find(
      (market) => market.slug.endsWith("-cze"),
    );

    assert.ok(homeMarket);
    assert.equal(homeMarket.id, "fifwc-cze-rsa-2026-06-18-cze");
    assert.equal(homeMarket.outcomePrices[0], "0.525");
    assert.equal(homeMarket.positionIds[0], "1302031158959328596181864012351689816200378008440816705951131802844602040320");
    assert.deepEqual(homeMarket.outcomes, ["Yes", "No"]);
  });

  it("infers over/under outcomes for totals", () => {
    const mapped = mapProphetComboMarketsResponse(stagingSample);
    const totalMarket = mapped.markets.find((market) =>
      market.slug.includes("total-2pt5"),
    );

    assert.ok(totalMarket);
    assert.deepEqual(totalMarket.outcomes, ["Over", "Under"]);
  });
});

describe("mapProphetMarketToComboRecord", () => {
  it("returns undefined when slug is not combo-eligible", () => {
    const record = mapProphetMarketToComboRecord(
      {
        slug: "fifwc-cze-rsa-2026-06-18-not-combo",
        outcomePrices: '["0.5", "0.5"]',
        positionIds: ["1", "2"],
        conditionId: "0xabc",
      },
      { comboSlugs: new Set(["fifwc-cze-rsa-2026-06-18-cze"]) },
    );

    assert.equal(record, undefined);
  });
});

describe("mapComboGameToItemProps", () => {
  it("classifies moneyline, exact score, and total odds", () => {
    const mapped = mapProphetComboMarketsResponse(stagingSample);
    const props = mapComboGameToItemProps(mapped.groups[0]);

    assert.equal(props.moneylineOdds.length, 3);
    assert.equal(props.topScoreOdds.length, 1);
    assert.equal(props.totalOdds?.length, 2);
    assert.equal(props.topScoreOdds[0]?.label, "1-0");
    assert.equal(props.moneylineOdds[0]?.label, "Czechia");
    assert.equal(props.moneylineOdds[1]?.label, "Draw");
    assert.equal(props.moneylineOdds[2]?.label, "South Africa");
    assert.deepEqual(
      props.totalOdds?.map((option) => option.label),
      ["O 2.5", "U 2.5"],
    );
  });

  it("excludes half and team totals from total odds", () => {
    const mapped = mapProphetComboMarketsResponse(stagingSample);
    const group = {
      ...mapped.groups[0],
      markets: [
        ...mapped.groups[0].markets,
        {
          id: "fifwc-cze-rsa-2026-06-18-first-half-total-1pt5",
          slug: "fifwc-cze-rsa-2026-06-18-first-half-total-1pt5",
          title: "1H O/U 1.5",
          outcomes: ["Over", "Under"] as [string, string],
          outcomePrices: ["0.4", "0.6"] as [string, string],
          positionIds: ["1", "2"] as [string, string],
          conditionId: "0xhalf",
        },
        {
          id: "fifwc-cze-rsa-2026-06-18-team-total-home-1pt5",
          slug: "fifwc-cze-rsa-2026-06-18-team-total-home-1pt5",
          title: "Czechia O/U 1.5",
          outcomes: ["Over", "Under"] as [string, string],
          outcomePrices: ["0.35", "0.65"] as [string, string],
          positionIds: ["3", "4"] as [string, string],
          conditionId: "0xteam",
        },
      ],
    };
    const props = mapComboGameToItemProps(group);

    assert.deepEqual(
      props.totalOdds?.map((option) => option.label),
      ["O 2.5", "U 2.5"],
    );
  });
});
