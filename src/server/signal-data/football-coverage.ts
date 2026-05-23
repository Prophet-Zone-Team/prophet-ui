import { worldCupTeams } from "../../data/teams/world-cup-teams";
import type { ApiFootballDataIssue, ApiFootballTeamContext, Team } from "../../types/market";
import { getSignalDataRepository } from "./repository";

const DIMENSIONS = ["profile", "fixtures", "squad", "injuries", "standings", "odds"] as const;

type FootballCoverageDimension = (typeof DIMENSIONS)[number];

export interface FootballCoverageReport {
  source: "api-football-cache";
  checkedAt: string;
  teamCount: number;
  cachedTeamCount: number;
  missingTeamCount: number;
  dimensionSummary: Record<FootballCoverageDimension, FootballCoverageDimensionSummary>;
  teams: FootballTeamCoverage[];
}

export interface FootballCoverageDimensionSummary {
  available: number;
  missing: number;
  issue: number;
}

export interface FootballTeamCoverage {
  teamId: Team["id"];
  teamName: string;
  code: string;
  cached: boolean;
  updatedAt?: string;
  dimensions: Record<FootballCoverageDimension, FootballDimensionCoverage>;
}

export interface FootballDimensionCoverage {
  status: "available" | "missing" | "issue";
  count: number;
  message?: string;
  updatedAt?: string;
}

export async function getFootballCoverageReport(now = new Date()): Promise<FootballCoverageReport> {
  const repository = await getSignalDataRepository();
  const context = await repository.readFootballTeamContext();
  const contextByTeamId = new Map(context.map((teamContext) => [teamContext.profile.teamId, teamContext]));
  const teams = worldCupTeams.map((team) => mapTeamCoverage(team, contextByTeamId.get(team.id)));

  return {
    source: "api-football-cache",
    checkedAt: now.toISOString(),
    teamCount: worldCupTeams.length,
    cachedTeamCount: teams.filter((team) => team.cached).length,
    missingTeamCount: teams.filter((team) => !team.cached).length,
    dimensionSummary: getDimensionSummary(teams),
    teams,
  };
}

function mapTeamCoverage(team: Team, context: ApiFootballTeamContext | undefined): FootballTeamCoverage {
  return {
    teamId: team.id,
    teamName: team.name,
    code: team.code,
    cached: Boolean(context),
    updatedAt: context?.profile.updatedAt,
    dimensions: {
      profile: context
        ? {
            status: "available",
            count: 1,
            updatedAt: context.profile.updatedAt,
          }
        : {
            status: "missing",
            count: 0,
            message: "No API-Football profile has been cached for this team yet.",
          },
      fixtures: mapDimensionCoverage(context, "fixtures", context?.fixtures.length ?? 0, latestUpdatedAt(context?.fixtures)),
      squad: mapDimensionCoverage(context, "squad", context?.squad.length ?? 0),
      injuries: mapDimensionCoverage(context, "injuries", context?.injuries.length ?? 0, latestUpdatedAt(context?.injuries)),
      standings: mapDimensionCoverage(context, "standings", context?.standings.length ?? 0, latestUpdatedAt(context?.standings)),
      odds: mapDimensionCoverage(context, "odds", context?.odds.length ?? 0, latestUpdatedAt(context?.odds)),
    },
  };
}

function mapDimensionCoverage(
  context: ApiFootballTeamContext | undefined,
  dimension: ApiFootballDataIssue["dimension"],
  count: number,
  updatedAt?: string,
): FootballDimensionCoverage {
  if (!context) {
    return {
      status: "missing",
      count: 0,
      message: "No API-Football context has been cached for this team yet.",
    };
  }

  if (count > 0) {
    return {
      status: "available",
      count,
      updatedAt,
    };
  }

  const issue = context.dataIssues.find((item) => item.dimension === dimension);

  if (issue) {
    return {
      status: "issue",
      count: 0,
      message: issue.message,
      updatedAt: issue.capturedAt,
    };
  }

  return {
    status: "missing",
    count: 0,
    message: `No ${dimension} rows are cached for this team yet.`,
  };
}

function getDimensionSummary(teams: FootballTeamCoverage[]): Record<FootballCoverageDimension, FootballCoverageDimensionSummary> {
  return Object.fromEntries(
    DIMENSIONS.map((dimension) => {
      const values = teams.map((team) => team.dimensions[dimension]);
      return [
        dimension,
        {
          available: values.filter((value) => value.status === "available").length,
          missing: values.filter((value) => value.status === "missing").length,
          issue: values.filter((value) => value.status === "issue").length,
        },
      ];
    }),
  ) as Record<FootballCoverageDimension, FootballCoverageDimensionSummary>;
}

function latestUpdatedAt(items: Array<{ updatedAt?: string }> | undefined): string | undefined {
  return (items ?? []).reduce<string | undefined>((latest, item) => {
    if (!item.updatedAt) {
      return latest;
    }

    return !latest || item.updatedAt > latest ? item.updatedAt : latest;
  }, undefined);
}
