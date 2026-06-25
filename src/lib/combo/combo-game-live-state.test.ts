import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  filterComboGroupsForDay,
  isComboGameLive,
  mergeComboGroupWithLiveSnapshot,
} from "@/lib/combo/combo-game-live-state";
import type { ComboGameGroup } from "@/types/combo";

const baseGroup: ComboGameGroup = {
  slug: "fifwc-fra-irq-2026-06-22",
  title: "France vs Iraq",
  kickoffLabel: "2026-06-22",
  status: "scheduled",
  eventId: "12345",
  homeTeam: { name: "France", code: "FRA" },
  awayTeam: { name: "Iraq", code: "IRQ" },
  markets: [],
};

describe("isComboGameLive", () => {
  it("returns true only for live status", () => {
    assert.equal(isComboGameLive({ ...baseGroup, status: "live" }), true);
    assert.equal(isComboGameLive({ ...baseGroup, status: "scheduled" }), false);
    assert.equal(isComboGameLive({ ...baseGroup, status: "finished" }), false);
  });
});

describe("filterComboGroupsForDay", () => {
  const groups: ComboGameGroup[] = [
    { ...baseGroup, slug: "live-game", status: "live" },
    { ...baseGroup, slug: "scheduled-game", status: "scheduled" },
    { ...baseGroup, slug: "finished-game", status: "finished" },
  ];

  it("removes ended games from today", () => {
    const filtered = filterComboGroupsForDay(groups, "today");

    assert.deepEqual(
      filtered.map((group) => group.slug),
      ["live-game", "scheduled-game"],
    );
  });

  it("keeps all groups for tomorrow and all tabs", () => {
    assert.equal(filterComboGroupsForDay(groups, "tomorrow").length, 3);
    assert.equal(filterComboGroupsForDay(groups, "all").length, 3);
  });
});

describe("mergeComboGroupWithLiveSnapshot", () => {
  it("merges live snapshot status and scores into group", () => {
    const merged = mergeComboGroupWithLiveSnapshot(baseGroup, {
      status: "live",
      homeScore: 1,
      awayScore: 0,
    });

    assert.equal(merged.status, "live");
    assert.equal(merged.homeScore, 1);
    assert.equal(merged.awayScore, 0);
  });

  it("returns original group when snapshot is missing", () => {
    assert.equal(mergeComboGroupWithLiveSnapshot(baseGroup, undefined), baseGroup);
  });
});
