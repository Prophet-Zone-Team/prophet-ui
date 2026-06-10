import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapGameStatisticsRows } from "@/lib/market/map-game-statistics";
import type { ProphetGetGameStatisticsData } from "@/types/prophet-api";

function parseGameStatisticsPayload(raw: ProphetGetGameStatisticsData) {
  const json = raw.statistics?.trim();

  if (!json) {
    return { statistics: [], events: [] };
  }

  const parsed = JSON.parse(json) as {
    statistics?: unknown;
    events?: unknown;
  };

  return {
    statistics: Array.isArray(parsed.statistics) ? parsed.statistics : [],
    events: Array.isArray(parsed.events) ? parsed.events : []
  };
}

describe("game statistics API envelope", () => {
  it("parses ucl-psg-ars-2026-05-30 live API envelope and maps rows", async () => {
    const response = await fetch(
      "https://api_stg.prophet.zone/v1/game/statistics?slug=ucl-psg-ars-2026-05-30"
    );
    const envelope = (await response.json()) as {
      code: number;
      data: ProphetGetGameStatisticsData;
    };

    assert.equal(envelope.code, 0);
    assert.ok(typeof envelope.data.statistics === "string");

    const payload = parseGameStatisticsPayload(envelope.data);
    const rows = mapGameStatisticsRows(
      payload,
      "Paris Saint-Germain FC",
      "Arsenal FC"
    );

    const possession = rows.find((row) => row.label === "Possession");
    assert.deepEqual(possession, {
      label: "Possession",
      homeValue: 75,
      awayValue: 25
    });
  });
});
