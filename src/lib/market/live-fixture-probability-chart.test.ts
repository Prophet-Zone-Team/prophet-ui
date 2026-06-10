import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  filterPriceHistoryByMatchStart,
  mapFixturePointsToElapsedFromStartTs,
  resolveLiveChartPriceHistoryKickoffAt,
  resolveLiveChartTimeWindow,
} from "@/lib/market/live-fixture-probability-chart";
import type { GameFixtureChartPoint } from "@/types/market";

describe("live-fixture-probability-chart", () => {
  it("resolveLiveChartPriceHistoryKickoffAt prefers match kickoffAt (start_time)", () => {
    const kickoffAt = "2026-06-02T19:00:00.000Z";
    const nowMs = Date.parse("2026-06-02T20:12:00.000Z");

    assert.equal(
      resolveLiveChartPriceHistoryKickoffAt(
        {
          id: "fif-hai-nzl-2026-06-02",
          status: "live",
          kickoffAt,
        } as never,
        nowMs
      ),
      kickoffAt
    );
  });

  it("filterPriceHistoryByMatchStart drops pre-kickoff samples", () => {
    const startTs = 1_700_000_000;
    const filtered = filterPriceHistoryByMatchStart(
      new Map([
        [
          "token-a",
          [
            { t: startTs - 3600, p: 0.4 },
            { t: startTs, p: 0.45 },
            { t: startTs + 720, p: 0.5 },
          ],
        ],
      ]),
      startTs
    );

    assert.deepEqual(filtered.get("token-a"), [
      { t: startTs, p: 0.45 },
      { t: startTs + 720, p: 0.5 },
    ]);
  });

  it("mapFixturePointsToElapsedFromStartTs aligns x with batch-prices-history t and start_ts", () => {
    const startTs = Math.floor(Date.parse("2026-06-02T19:00:00.000Z") / 1000);
    const rawPoints: GameFixtureChartPoint[] = [
      {
        matchId: "test",
        timestamp: new Date((startTs + 720) * 1000).toISOString(),
        label: "",
        home: 40,
        draw: 30,
        away: 30,
      },
    ];

    const mapped = mapFixturePointsToElapsedFromStartTs(rawPoints, startTs);

    assert.equal(mapped[0]?.elapsedSeconds, 720);
  });

  it("timeWindow startTs matches kickoff used for elapsed mapping", () => {
    const kickoffAt = "2026-06-02T19:00:00.000Z";
    const nowMs = Date.parse("2026-06-02T20:00:00.000Z");
    const window = resolveLiveChartTimeWindow(kickoffAt, nowMs);

    assert.ok(window);
    assert.equal(
      window.startTs,
      Math.floor(Date.parse(kickoffAt) / 1000)
    );
  });
});
