import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CuratedTeamEntry } from "@/data/teams/curated-team-list";

import {
  curatedEntryToTournamentState,
  getPortfolioStrategyStatusDisplayFromCurated,
  parseProphetStrategyTeamStatus,
  resolveStrategyTeamTournamentState
} from "./portfolio-strategy-status";

function team(overrides: Partial<CuratedTeamEntry> & { name: string }): CuratedTeamEntry {
  return {
    logo: "",
    abbreviation: overrides.name.slice(0, 3).toUpperCase(),
    continent: "Europe",
    started: false,
    eliminated: false,
    ...overrides
  };
}

describe("parseProphetStrategyTeamStatus", () => {
  it("parses not_started", () => {
    assert.deepEqual(parseProphetStrategyTeamStatus("not_started"), {
      started: false,
      eliminated: false
    });
  });

  it("parses unstart", () => {
    assert.deepEqual(parseProphetStrategyTeamStatus("unstart"), {
      started: false,
      eliminated: false
    });
  });

  it("parses ongoing", () => {
    assert.deepEqual(parseProphetStrategyTeamStatus("ongoing"), {
      started: true,
      eliminated: false
    });
  });

  it("parses lose", () => {
    assert.deepEqual(parseProphetStrategyTeamStatus("lose"), {
      started: true,
      eliminated: true
    });
  });

  it("parses win", () => {
    assert.deepEqual(parseProphetStrategyTeamStatus("win"), {
      started: true,
      eliminated: false,
      won: true
    });
  });

  it("parses eliminated", () => {
    assert.deepEqual(parseProphetStrategyTeamStatus("eliminated"), {
      started: true,
      eliminated: true
    });
  });
});

describe("resolveStrategyTeamTournamentState", () => {
  it("ignores curated started when API status is absent", () => {
    const state = resolveStrategyTeamTournamentState(
      { order_id: "1", name: "Spain" },
      team({ name: "Spain", started: true })
    );

    assert.deepEqual(state, { started: false, eliminated: false });
  });

  it("uses curated eliminated when API status is absent", () => {
    const state = resolveStrategyTeamTournamentState(
      { order_id: "1", name: "Mexico" },
      team({ name: "Mexico", started: true, eliminated: true })
    );

    assert.deepEqual(state, { started: true, eliminated: true });
  });
});

describe("getPortfolioStrategyStatusDisplayFromCurated", () => {
  it("uses curated started flags for catalog strategies", () => {
    const display = getPortfolioStrategyStatusDisplayFromCurated([
      team({ name: "Spain", started: true }),
      team({ name: "France", started: false })
    ]);

    assert.equal(display.status, "not_finished");
  });
});

describe("curatedEntryToTournamentState", () => {
  it("treats started or eliminated as started", () => {
    assert.deepEqual(
      curatedEntryToTournamentState(team({ name: "Spain", started: true })),
      { started: true, eliminated: false }
    );
  });
});
