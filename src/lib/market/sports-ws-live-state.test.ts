import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  mergeLiveMatchElapsedState,
  mergeLiveSnapshot,
  polymarketSportsWsUpdateToLivePatch,
} from "@/lib/market/sports-ws-live-state";

describe("polymarketSportsWsUpdateToLivePatch elapsed handling", () => {
  it("maps numeric elapsed minutes to seconds", () => {
    const patch = polymarketSportsWsUpdateToLivePatch(
      { elapsed: 72, live: true },
      { status: "live" }
    );

    assert.equal(patch.liveElapsedSeconds, 72 * 60);
    assert.equal(patch.liveElapsedUnavailable, false);
  });

  it("marks empty elapsed as unavailable and clears the clock baseline", () => {
    const patch = polymarketSportsWsUpdateToLivePatch(
      { elapsed: "", period: "HT", live: true },
      {
        status: "live",
        liveElapsedSeconds: 5400,
      }
    );

    assert.equal(patch.liveElapsedSeconds, undefined);
    assert.equal(patch.liveElapsedUnavailable, true);
    assert.equal(patch.period, "HT");
  });

  it("mergeLiveSnapshot clears stale elapsed when WS elapsed is empty", () => {
    const merged = mergeLiveSnapshot(
      {
        status: "live",
        liveElapsedSeconds: 5400,
      },
      polymarketSportsWsUpdateToLivePatch(
        { elapsed: "", period: "HT", live: true },
        { status: "live", liveElapsedSeconds: 5400 }
      )
    );

    assert.equal(merged?.liveElapsedSeconds, undefined);
    assert.equal(merged?.liveElapsedUnavailable, true);
    assert.equal(merged?.period, "HT");
  });

  it("restores elapsed when WS sends a valid value again", () => {
    const merged = mergeLiveSnapshot(
      {
        status: "live",
        liveElapsedUnavailable: true,
        period: "HT",
      },
      polymarketSportsWsUpdateToLivePatch(
        { elapsed: 46, period: "2H", live: true },
        { status: "live", liveElapsedUnavailable: true, period: "HT" }
      )
    );

    assert.equal(merged?.liveElapsedSeconds, 46 * 60);
    assert.equal(merged?.liveElapsedUnavailable, false);
    assert.equal(merged?.period, "2H");
  });
});

describe("mergeLiveMatchElapsedState", () => {
  it("preserves current elapsed when patch omits elapsed fields", () => {
    const merged = mergeLiveMatchElapsedState(
      { liveElapsedSeconds: 1800, liveElapsedUnavailable: false },
      {}
    );

    assert.equal(merged.liveElapsedSeconds, 1800);
    assert.equal(merged.liveElapsedUnavailable, false);
  });
});
