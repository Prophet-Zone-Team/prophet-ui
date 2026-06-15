import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  parsePolymarketStatsTopMove,
  parsePolymarketStatsVolume,
} from "@/lib/market/map-polymarket-stats";
import type { ProphetGetPolymarketStatsData } from "@/types/prophet-api";

const stagingSample: ProphetGetPolymarketStatsData = {
  volume: "2554693407.0417748",
  oneDayPriceChange: "0.013",
  oneDayPriceChangeTeam: "Portugal",
};

describe("parsePolymarketStatsVolume", () => {
  it("parses staging sample volume", () => {
    assert.equal(parsePolymarketStatsVolume(stagingSample), 2_554_693_407.0417748);
  });

  it("returns undefined for missing or invalid volume", () => {
    assert.equal(parsePolymarketStatsVolume(undefined), undefined);
    assert.equal(parsePolymarketStatsVolume({ volume: "" }), undefined);
    assert.equal(parsePolymarketStatsVolume({ volume: "not-a-number" }), undefined);
  });
});

describe("parsePolymarketStatsTopMove", () => {
  it("maps staging sample to Portugal with normalized change percent", () => {
    const topMove = parsePolymarketStatsTopMove(stagingSample);

    assert.ok(topMove);
    assert.equal(topMove.team?.code, "PRT");
    assert.equal(topMove.teamCode, "PRT");
    assert.equal(topMove.teamName, "Portugal");
    assert.equal(topMove.changePercent, 1.3);
  });

  it("returns undefined when team name is missing", () => {
    assert.equal(
      parsePolymarketStatsTopMove({ oneDayPriceChange: "0.01" }),
      undefined,
    );
  });

  it("falls back to team code prefix when team is unknown", () => {
    const topMove = parsePolymarketStatsTopMove({
      oneDayPriceChange: "0.02",
      oneDayPriceChangeTeam: "Unknown Nation FC",
    });

    assert.ok(topMove);
    assert.equal(topMove.team, undefined);
    assert.equal(topMove.teamCode, "UNK");
    assert.equal(topMove.teamName, "Unknown Nation FC");
    assert.equal(topMove.changePercent, 2);
  });

  it("returns undefined changePercent for invalid price change", () => {
    const topMove = parsePolymarketStatsTopMove({
      oneDayPriceChange: "invalid",
      oneDayPriceChangeTeam: "Portugal",
    });

    assert.ok(topMove);
    assert.equal(topMove.changePercent, undefined);
  });
});
