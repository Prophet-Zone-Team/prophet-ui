import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getCalendarDateInTimezone,
  hasFreshComboMarketsSnapshot,
  isComboMarketsSnapshotStale,
} from "@/lib/combo/combo-markets-cache";
import type { ComboMarketsDaySnapshot } from "@/types/combo";

function buildSnapshot(cachedOnDate: string): ComboMarketsDaySnapshot {
  return {
    groups: [
      {
        slug: "fifwc-a-b-2026-06-18",
        title: "A vs B",
        kickoffLabel: "2026-06-18",
        homeTeam: { name: "A", code: "A" },
        awayTeam: { name: "B", code: "B" },
        markets: [
          {
            id: "market-a",
            slug: "market-a",
            conditionId: "0xabc",
            positionIds: ["1", "2"],
            title: "Market A",
            outcomes: ["Yes", "No"],
            outcomePrices: ["0.5", "0.5"],
          },
        ],
      },
    ],
    markets: [],
    nextCursor: null,
    cachedOnDate,
    timezone: "Asia/Shanghai",
  };
}

describe("combo markets cache", () => {
  it("marks snapshot stale after calendar day changes in timezone", () => {
    const snapshot = buildSnapshot("2026-06-18");
    const timezone = "Asia/Shanghai";
    const sameDay = new Date("2026-06-18T15:00:00+08:00");
    const nextDay = new Date("2026-06-19T00:30:00+08:00");

    assert.equal(isComboMarketsSnapshotStale(snapshot, timezone, sameDay), false);
    assert.equal(isComboMarketsSnapshotStale(snapshot, timezone, nextDay), true);
    assert.equal(hasFreshComboMarketsSnapshot(snapshot, timezone, sameDay), true);
    assert.equal(hasFreshComboMarketsSnapshot(snapshot, timezone, nextDay), false);
  });

  it("treats missing cachedOnDate as stale", () => {
    const snapshot = buildSnapshot("");
    assert.equal(
      isComboMarketsSnapshotStale(snapshot, "Asia/Shanghai"),
      true,
    );
  });

  it("formats calendar date in timezone", () => {
    const date = new Date("2026-06-18T20:00:00Z");

    assert.equal(
      getCalendarDateInTimezone("Asia/Shanghai", date),
      "2026-06-19",
    );
    assert.equal(getCalendarDateInTimezone("UTC", date), "2026-06-18");
  });
});
