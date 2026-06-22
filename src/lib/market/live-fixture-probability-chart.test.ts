import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  filterPriceHistoryByMatchStart,
  LIVE_MATCH_HALFTIME_PAUSE_SECONDS,
  LIVE_MATCH_HYDRATION_BREAK_SECONDS,
  mapFixturePointsToElapsedFromStartTs,
  resolveAxisSecondsFromMatchClock,
  resolveLiveChartAxisTicksWithBreaks,
  resolveLiveChartMaxAxisSeconds,
  resolveLiveChartPriceHistoryKickoffAt,
  resolveLiveChartTimeWindow,
  resolveMatchClockFromAxisSeconds,
  resolveMatchClockSecondsFromWallElapsed,
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

  it("resolveAxisSecondsFromMatchClock adds hydration and halftime offsets", () => {
    assert.equal(resolveAxisSecondsFromMatchClock(22 * 60), 22 * 60);
    assert.equal(
      resolveAxisSecondsFromMatchClock(30 * 60),
      30 * 60 + LIVE_MATCH_HYDRATION_BREAK_SECONDS
    );
    assert.equal(
      resolveAxisSecondsFromMatchClock(45 * 60),
      45 * 60 + LIVE_MATCH_HYDRATION_BREAK_SECONDS
    );
    assert.equal(
      resolveAxisSecondsFromMatchClock(52 * 60),
      52 * 60 +
        LIVE_MATCH_HYDRATION_BREAK_SECONDS +
        LIVE_MATCH_HALFTIME_PAUSE_SECONDS
    );
    assert.equal(
      resolveAxisSecondsFromMatchClock(75 * 60),
      75 * 60 +
        LIVE_MATCH_HYDRATION_BREAK_SECONDS * 2 +
        LIVE_MATCH_HALFTIME_PAUSE_SECONDS
    );
  });

  it("resolveMatchClockFromAxisSeconds inverts expanded axis positions", () => {
    assert.equal(resolveMatchClockFromAxisSeconds(15 * 60), 15 * 60);
    assert.equal(
      resolveMatchClockFromAxisSeconds(30 * 60 + LIVE_MATCH_HYDRATION_BREAK_SECONDS),
      30 * 60
    );
    assert.equal(
      resolveMatchClockFromAxisSeconds(
        45 * 60 + LIVE_MATCH_HYDRATION_BREAK_SECONDS
      ),
      45 * 60
    );
    assert.equal(
      resolveMatchClockFromAxisSeconds(
        52 * 60 +
          LIVE_MATCH_HYDRATION_BREAK_SECONDS +
          LIVE_MATCH_HALFTIME_PAUSE_SECONDS
      ),
      52 * 60
    );
  });

  it("resolveMatchClockSecondsFromWallElapsed maps second-half wall time", () => {
    const matchClockSeconds = 52 * 60;
    const wallElapsedSeconds =
      matchClockSeconds +
      LIVE_MATCH_HYDRATION_BREAK_SECONDS +
      LIVE_MATCH_HALFTIME_PAUSE_SECONDS;

    assert.equal(
      resolveMatchClockSecondsFromWallElapsed(wallElapsedSeconds, {
        currentMatchClockSeconds: matchClockSeconds,
        matchPeriod: "2H",
      }),
      matchClockSeconds
    );
  });

  it("resolveMatchClockSecondsFromWallElapsed clamps to 45' during HT", () => {
    assert.equal(
      resolveMatchClockSecondsFromWallElapsed(50 * 60, {
        currentMatchClockSeconds: 45 * 60,
        matchPeriod: "HT",
      }),
      45 * 60
    );
  });

  it("resolveLiveChartAxisTicksWithBreaks expands halftime gap between 30' and 45'", () => {
    const ticks = resolveLiveChartAxisTicksWithBreaks(52 * 60);

    assert.deepEqual(
      ticks,
      [0, 15, 30, 45].map((minute) =>
        resolveAxisSecondsFromMatchClock(minute * 60)
      )
    );
    assert.equal(
      ticks[3]! - ticks[2]!,
      15 * 60 + LIVE_MATCH_HYDRATION_BREAK_SECONDS
    );
  });

  it("resolveLiveChartMaxAxisSeconds includes all scheduled breaks through 90'", () => {
    assert.equal(
      resolveLiveChartMaxAxisSeconds(90 * 60),
      90 * 60 +
        LIVE_MATCH_HYDRATION_BREAK_SECONDS * 2 +
        LIVE_MATCH_HALFTIME_PAUSE_SECONDS
    );
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
