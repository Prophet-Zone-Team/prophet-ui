import assert from "node:assert/strict";
import { describe, it } from "node:test";

import curatedTeams from "@/data/teams/index";
import { getAllWorldCup2026Teams } from "@/data/world-cup-2026/groups";
import {
  curatedAbbreviationToCode,
  findCuratedTeamById,
} from "@/data/teams/curated-team-list";
import { resolveTeamSide } from "@/lib/market/map-game-statistics";

function buildApiNameVariantsByAbbreviation(): Map<string, Set<string>> {
  const variants = new Map<string, Set<string>>();

  for (const [key, entry] of Object.entries(curatedTeams)) {
    const abbrev = entry.abbreviation.trim().toLowerCase();
    const names = variants.get(abbrev) ?? new Set<string>();

    names.add(key);
    names.add(entry.name);
    variants.set(abbrev, names);
  }

  return variants;
}

function resolveCuratedAbbreviationForWorldCupTeam(teamId: string): string | undefined {
  const curated = findCuratedTeamById(teamId);

  if (!curated) {
    return undefined;
  }

  const match = Object.entries(curatedTeams).find(([, entry]) => {
    return curatedAbbreviationToCode(entry.abbreviation) === curated.code;
  });

  return match?.[1]?.abbreviation.trim().toLowerCase();
}

describe("map-game-statistics team alias audit", () => {
  it("resolves all known API-Football name variants for World Cup teams", () => {
    const apiNamesByAbbrev = buildApiNameVariantsByAbbreviation();
    const worldCupTeams = getAllWorldCup2026Teams();
    const failures: Array<{
      team: string;
      uiName: string;
      apiName: string;
    }> = [];

    for (const team of worldCupTeams) {
      const curated = findCuratedTeamById(team.id);
      const uiName = curated?.name ?? team.name;
      const abbrev = resolveCuratedAbbreviationForWorldCupTeam(team.id);
      const apiNames = abbrev
        ? [...(apiNamesByAbbrev.get(abbrev) ?? [team.name])]
        : [team.name];
      const opponent = worldCupTeams.find((entry) => entry.id !== team.id);

      assert.ok(opponent, `missing opponent for ${team.id}`);

      const opponentCurated = findCuratedTeamById(opponent.id);
      const opponentUiName = opponentCurated?.name ?? opponent.name;

      for (const apiName of apiNames) {
        const side = resolveTeamSide(apiName, uiName, opponentUiName);

        if (side !== "home") {
          failures.push({ team: team.name, uiName, apiName });
        }
      }
    }

    assert.deepEqual(
      failures,
      [],
      `Unresolved API/UI team pairs:\n${failures
        .map(
          (failure) =>
            `- ${failure.team}: API "${failure.apiName}" vs UI "${failure.uiName}"`
        )
        .join("\n")}`
    );
  });

  it("covers high-risk API-Football aliases used in production", () => {
    const opponent = "Paraguay";
    const cases: Array<{ apiName: string; uiName: string }> = [
      { apiName: "USA", uiName: "United States" },
      { apiName: "Korea Republic", uiName: "South Korea" },
      { apiName: "South Korea", uiName: "Korea Republic" },
      { apiName: "IR Iran", uiName: "Iran" },
      { apiName: "Côte d'Ivoire", uiName: "Ivory Coast" },
      { apiName: "Cabo Verde", uiName: "Cape Verde" },
      { apiName: "DR Congo", uiName: "Congo DR" },
      { apiName: "Bosnia & Herzegovina", uiName: "Bosnia-Herzegovina" },
      { apiName: "Czech Republic", uiName: "Czechia" },
      { apiName: "Türkiye", uiName: "Turkiye" },
      { apiName: "Turkey", uiName: "Turkiye" },
      { apiName: "Holland", uiName: "Netherlands" },
      { apiName: "Curacao", uiName: "Curaçao" },
    ];

    for (const { apiName, uiName } of cases) {
      assert.equal(
        resolveTeamSide(apiName, uiName, opponent),
        "home",
        `${apiName} should match ${uiName}`
      );
    }
  });
});
