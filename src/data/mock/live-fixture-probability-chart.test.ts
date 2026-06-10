import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildMockLiveFixtureProbabilityChart } from "@/data/mock/live-fixture-probability-chart";
import { MOCK_LIVE_FIXTURE_ELAPSED_SECONDS } from "@/lib/market/mock-live-fixture-config";

const KICKOFF_AT = "2026-05-30T19:00:00.000Z";
const MATCH_ID = "ucl-psg-ars-2026-05-30";

describe("live-fixture-probability-chart mock", () => {
  it("builds 14 ternary points from 0 to 65 minutes at 5-minute steps", () => {
    const result = buildMockLiveFixtureProbabilityChart({
      matchId: MATCH_ID,
      kickoffAt: KICKOFF_AT,
      chartMode: "ternary",
    });

    assert.equal(result.chartMode, "ternary");
    assert.equal(result.points.length, 14);
    assert.equal(result.binaryPoints.length, 0);
    assert.equal(result.points[0]?.elapsedSeconds, 0);
    assert.equal(
      result.points[result.points.length - 1]?.elapsedSeconds,
      MOCK_LIVE_FIXTURE_ELAPSED_SECONDS
    );

    for (let index = 1; index < result.points.length; index += 1) {
      const step =
        (result.points[index]?.elapsedSeconds ?? 0) -
        (result.points[index - 1]?.elapsedSeconds ?? 0);
      assert.equal(step, 300);
    }
  });

  it("interpolates ternary probabilities and keeps rows near 100%", () => {
    const result = buildMockLiveFixtureProbabilityChart({
      matchId: MATCH_ID,
      kickoffAt: KICKOFF_AT,
      chartMode: "ternary",
    });

    const kickoff = result.points[0];
    const midpoint = result.points[6];
    const latest = result.points[result.points.length - 1];

    assert.deepEqual(
      { home: kickoff?.home, draw: kickoff?.draw, away: kickoff?.away },
      { home: 42, draw: 30, away: 28 }
    );
    assert.deepEqual(
      { home: latest?.home, draw: latest?.draw, away: latest?.away },
      { home: 48, draw: 22, away: 30 }
    );
    assert.ok((midpoint?.away ?? 0) > (kickoff?.away ?? 0));

    for (const point of result.points) {
      const total = (point.home ?? 0) + (point.draw ?? 0) + (point.away ?? 0);
      assert.ok(Math.abs(total - 100) <= 1);
    }
  });

  it("builds binary mock points", () => {
    const result = buildMockLiveFixtureProbabilityChart({
      matchId: MATCH_ID,
      kickoffAt: KICKOFF_AT,
      chartMode: "binary",
    });

    assert.equal(result.chartMode, "binary");
    assert.equal(result.points.length, 0);
    assert.equal(result.binaryPoints.length, 14);
    assert.equal(result.binaryPoints[0]?.primary, 52);
    assert.equal(result.binaryPoints[0]?.secondary, 48);
    assert.equal(
      result.binaryPoints[result.binaryPoints.length - 1]?.primary,
      55
    );
  });
});
