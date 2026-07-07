import { formatMatchVersusTitle } from "@/lib/market/trade-widget-header";
import type { UserOpenOrder } from "@/lib/portfolio/types";
import type {
  PortfolioMarketKind,
  ProphetTeamsConditionEntry,
  ProphetTeamsConditionTeam
} from "@/types/prophet-api";
import type { UserPositionRecord } from "@/types/market";

export type OpenOrderMarketContext = {
  title: string;
  teams: ProphetTeamsConditionTeam[];
  slug?: string;
  icon?: string;
  marketKind?: PortfolioMarketKind;
};

export function formatTeamsConditionTitle(
  teams: ProphetTeamsConditionTeam[]
): string {
  if (teams.length === 0) {
    return "";
  }

  if (teams.length === 1) {
    return teams[0]?.name ?? "";
  }

  const home =
    teams.find((team) => team.ordering === "home") ?? teams[0];
  const away =
    teams.find((team) => team.ordering === "away") ?? teams[1] ?? teams[0];

  return formatMatchVersusTitle(home.name, away.name);
}

export function collectUniqueConditionIds(orders: UserOpenOrder[]): string[] {
  const ids = new Set<string>();

  for (const order of orders) {
    const market = order.market?.trim();

    if (market) {
      ids.add(market);
    }
  }

  return [...ids];
}

export function collectUniqueConditionIdsFromPositions(
  positions: UserPositionRecord[]
): string[] {
  const ids = new Set<string>();

  for (const position of positions) {
    const conditionId = position.conditionId?.trim();

    if (conditionId) {
      ids.add(conditionId);
    }
  }

  return [...ids];
}

export function buildOpenOrderMarketMap(
  data: Record<string, ProphetTeamsConditionEntry>
): Record<string, OpenOrderMarketContext> {
  const map: Record<string, OpenOrderMarketContext> = {};

  for (const [conditionId, entry] of Object.entries(data)) {
    const safeTeams = Array.isArray(entry?.teams) ? entry.teams : [];
    map[conditionId] = {
      title:
        entry?.question?.trim() || formatTeamsConditionTitle(safeTeams),
      teams: safeTeams,
      slug: entry?.slug?.trim() || undefined,
      icon: entry?.icon?.trim() || undefined,
      marketKind: entry?.marketKind
    };
  }

  return map;
}

export function resolveMatchSidesFromTeams(
  teams: ProphetTeamsConditionTeam[]
): { home: ProphetTeamsConditionTeam; away: ProphetTeamsConditionTeam } | undefined {
  if (teams.length < 2) {
    return undefined;
  }

  const home = teams.find((team) => team.ordering === "home") ?? teams[0];
  const away =
    teams.find((team) => team.ordering === "away") ?? teams[1] ?? teams[0];

  if (!home || !away) {
    return undefined;
  }

  return { home, away };
}

export type PortfolioMarketIcon =
  | { kind: "single"; teamName: string }
  | { kind: "match"; homeName: string; awayName: string }
  | { kind: "draw" }
  | { kind: "image"; src: string }
  | { kind: "placeholder" };

export type PortfolioMarketIconOptions = {
  contextIcon?: string;
  marketKind?: PortfolioMarketKind;
};

function normalizeOptionalText(value?: string): string {
  return value?.trim() ?? "";
}

export function resolvePortfolioPositionIcon(
  position: Pick<UserPositionRecord, "icon" | "outcome">,
  teams: ProphetTeamsConditionTeam[],
  options: PortfolioMarketIconOptions = {}
): PortfolioMarketIcon {
  const iconSrc = position.icon?.trim();

  if (iconSrc) {
    return { kind: "image", src: iconSrc };
  }

  return resolvePortfolioMarketIcon(teams, position.outcome, options);
}

export function resolvePortfolioMarketIcon(
  teams: ProphetTeamsConditionTeam[],
  outcome?: string,
  options: PortfolioMarketIconOptions = {}
): PortfolioMarketIcon {
  const contextIcon = options.contextIcon?.trim();

  if (contextIcon) {
    return { kind: "image", src: contextIcon };
  }

  if (options.marketKind === "game") {
    return { kind: "placeholder" };
  }

  const normalizedOutcome = normalizeOptionalText(outcome).toLowerCase();

  if (teams.length === 0) {
    return { kind: "placeholder" };
  }

  if (teams.length === 1) {
    const team = resolveTeamForOutcome(teams, outcome);
    return { kind: "single", teamName: team?.name ?? teams[0]?.name ?? "" };
  }

  const sides = resolveMatchSidesFromTeams(teams);

  if (!sides) {
    return { kind: "placeholder" };
  }

  const matchedTeam = teams.find(
    (team) =>
      normalizeOptionalText(team.name).toLowerCase() === normalizedOutcome
  );

  if (matchedTeam) {
    return { kind: "single", teamName: matchedTeam.name };
  }

  if (normalizedOutcome === "draw") {
    return { kind: "draw" };
  }

  return {
    kind: "match",
    homeName: sides.home.name,
    awayName: sides.away.name
  };
}

export function resolveTeamForOutcome(
  teams: ProphetTeamsConditionTeam[],
  outcome?: string
): ProphetTeamsConditionTeam | undefined {
  const normalizedOutcome = normalizeOptionalText(outcome).toLowerCase();

  if (!normalizedOutcome) {
    return undefined;
  }

  const matched = teams.find(
    (team) =>
      normalizeOptionalText(team.name).toLowerCase() === normalizedOutcome
  );

  if (matched) {
    return matched;
  }

  if (teams.length === 1) {
    return teams[0];
  }

  return undefined;
}

function extractSubjectTeamFromTitle(title: string): string | undefined {
  const match = title.match(/^Will\s+(.+?)\s+win\b/i);
  return match?.[1]?.trim();
}

function findTeamByNameFragment(
  teams: ProphetTeamsConditionTeam[],
  fragment: string
): ProphetTeamsConditionTeam | undefined {
  const normalizedFragment = fragment.trim().toLowerCase();

  if (!normalizedFragment) {
    return undefined;
  }

  return teams.find((team) => {
    const normalizedName = normalizeOptionalText(team.name).toLowerCase();

    if (!normalizedName) {
      return false;
    }

    return (
      normalizedName === normalizedFragment ||
      normalizedName.includes(normalizedFragment) ||
      normalizedFragment.includes(normalizedName)
    );
  });
}

export function resolvePortfolioTeamName(
  teams: ProphetTeamsConditionTeam[],
  position: Pick<UserPositionRecord, "outcome" | "title">
): string | undefined {
  const normalizedOutcome = normalizeOptionalText(position.outcome).toLowerCase();
  const fromOutcome = resolveTeamForOutcome(teams, position.outcome)?.name;

  if (fromOutcome) {
    return fromOutcome;
  }

  if (normalizedOutcome === "yes" || normalizedOutcome === "no") {
    const subject = extractSubjectTeamFromTitle(position.title);

    if (subject) {
      return findTeamByNameFragment(teams, subject)?.name ?? subject;
    }
  }

  if (teams.length === 1) {
    return teams[0]?.name;
  }

  return undefined;
}

function isGenericReportLabel(label: string): boolean {
  const normalized = label.trim().toLowerCase();

  return normalized === "yes" || normalized === "no";
}

export function resolveReportTeamName(input: {
  candidate?: string;
  title?: string;
  outcome?: string;
  teams?: ProphetTeamsConditionTeam[];
  homeName?: string;
  awayName?: string;
  fixtureSide?: string;
}): string {
  const teams = input.teams ?? [];

  if (input.title?.trim() || input.outcome?.trim()) {
    const fromPortfolio = resolvePortfolioTeamName(teams, {
      title: input.title?.trim() ?? "",
      outcome: input.outcome?.trim() ?? ""
    });

    if (fromPortfolio) {
      return fromPortfolio;
    }
  }

  const candidate = input.candidate?.trim();

  if (candidate && !isGenericReportLabel(candidate)) {
    const matched = findTeamByNameFragment(teams, candidate);

    if (matched?.name) {
      return matched.name;
    }

    if (!candidate.includes(" vs ")) {
      return candidate;
    }
  }

  const side = input.fixtureSide?.trim().toLowerCase();

  if (side === "home" && input.homeName?.trim()) {
    return input.homeName.trim();
  }

  if (side === "away" && input.awayName?.trim()) {
    return input.awayName.trim();
  }

  if (side === "draw") {
    return "Draw";
  }

  if (input.homeName?.trim() && input.awayName?.trim()) {
    return formatMatchVersusTitle(input.homeName.trim(), input.awayName.trim());
  }

  return candidate ?? "";
}
