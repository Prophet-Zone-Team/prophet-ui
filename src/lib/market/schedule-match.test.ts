import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapProphetGameToMatch } from "@/lib/market/prophet-game-mapper";
import {
  buildScheduleMatchList,
  filterScheduleMatches,
  filterScheduleMatchesByTeams,
} from "@/lib/market/schedule-match";

describe("schedule-match team filtering", () => {
  it("filters matches for teams whose polymarket labels use alternate curated keys", () => {
    const games = [
      {
        slug: "fifwc-kr-cze-2026-06-11",
        title: "Korea Republic vs. Czechia",
        teams: [{ name: "Korea Republic" }, { name: "Czechia" }],
        active: 1,
      },
      {
        slug: "fifwc-usa-par-2026-06-12",
        title: "United States vs. Paraguay",
        teams: [{ name: "United States" }, { name: "Paraguay" }],
        active: 1,
      },
      {
        slug: "fifwc-esp-cvi-2026-06-15",
        title: "Spain vs. Cabo Verde",
        teams: [{ name: "Spain" }, { name: "Cabo Verde" }],
        active: 1,
      },
      {
        slug: "fifwc-irn-nzl-2026-06-15",
        title: "IR Iran vs. New Zealand",
        teams: [{ name: "IR Iran" }, { name: "New Zealand" }],
        active: 1,
      },
      {
        slug: "fifwc-civ-ecu-2026-06-14",
        title: "Côte d'Ivoire vs. Ecuador",
        teams: [{ name: "Côte d'Ivoire" }, { name: "Ecuador" }],
        active: 1,
      },
      {
        slug: "fifwc-prt-cdr-2026-06-17",
        title: "Portugal vs. DR Congo",
        teams: [{ name: "Portugal" }, { name: "DR Congo" }],
        active: 1,
      },
    ];

    const matches = games
      .map((game) => mapProphetGameToMatch(game))
      .filter((match): match is NonNullable<typeof match> => match !== undefined);

    const filterCases = [
      { teamId: "south-korea", slug: "fifwc-kr-cze-2026-06-11" },
      { teamId: "usa", slug: "fifwc-usa-par-2026-06-12" },
      { teamId: "cape-verde", slug: "fifwc-esp-cvi-2026-06-15" },
      { teamId: "iran", slug: "fifwc-irn-nzl-2026-06-15" },
      { teamId: "ivory-coast", slug: "fifwc-civ-ecu-2026-06-14" },
      { teamId: "congo-dr", slug: "fifwc-prt-cdr-2026-06-17" },
    ] as const;

    for (const { teamId, slug } of filterCases) {
      const filtered = filterScheduleMatchesByTeams(matches, [teamId]);

      assert.equal(
        filtered.some((match) => match.id === slug),
        true,
        `expected ${teamId} to match ${slug}`,
      );
    }
  });
});

describe("schedule-match ended filter", () => {
  const baseMatch = {
    homeTeamId: "usa",
    awayTeamId: "mex",
    kickoffAt: "2026-06-11T18:00:00.000Z",
  } as const;

  const upcoming = {
    ...baseMatch,
    id: "upcoming",
    status: "scheduled" as const,
    kickoffAt: "2026-06-20T18:00:00.000Z",
  };
  const live = {
    ...baseMatch,
    id: "live",
    status: "live" as const,
    kickoffAt: "2026-06-15T18:00:00.000Z",
  };
  const olderEnded = {
    ...baseMatch,
    id: "older-ended",
    status: "finished" as const,
    kickoffAt: "2026-06-10T18:00:00.000Z",
  };
  const newerEnded = {
    ...baseMatch,
    id: "newer-ended",
    status: "finished" as const,
    kickoffAt: "2026-06-12T18:00:00.000Z",
  };

  const matches = [upcoming, live, olderEnded, newerEnded];

  it("hides ended matches when showEnded is false", () => {
    const filtered = filterScheduleMatches(matches, false);

    assert.deepEqual(
      filtered.map((match) => match.id),
      ["upcoming", "live"],
    );
  });

  it("shows only ended matches in reverse time order when showEnded is true", () => {
    const filtered = filterScheduleMatches(matches, true);

    assert.deepEqual(
      filtered.map((match) => match.id),
      ["older-ended", "newer-ended"],
    );

    const sorted = buildScheduleMatchList(matches, [], {
      showEnded: true,
      sortKey: "time",
    });

    assert.deepEqual(
      sorted.map((match) => match.id),
      ["newer-ended", "older-ended"],
    );
  });
});
