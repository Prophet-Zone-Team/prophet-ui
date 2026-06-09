import { curatedTeamsById } from "@/data/teams/curated-team-list";
import { gameTradeHref, teamTradeHref } from "@/lib/routes/trade";
import { resolveMatchSidesFromTeams } from "@/lib/portfolio/teams-condition";
import type { ProphetTeamsConditionTeam } from "@/types/prophet-api";
import type { UserPositionRecord } from "@/types/market";

const FIXTURE_SLUG_PATTERN = /^(.+\d{4}-\d{2}-\d{2})(?:-.+)?$/;

export function isPortfolioGamePosition(
  position: Pick<UserPositionRecord, "slug">,
  teams: ProphetTeamsConditionTeam[] = []
): boolean {
  const slug = position.slug?.trim();

  if (!slug) {
    return false;
  }

  if (curatedTeamsById.has(slug)) {
    return false;
  }

  if (resolveMatchSidesFromTeams(teams)) {
    return true;
  }

  return FIXTURE_SLUG_PATTERN.test(slug);
}

function resolveGameTradeSlug(slug: string): string {
  const trimmed = slug.trim();
  const match = trimmed.match(FIXTURE_SLUG_PATTERN);

  return match?.[1] ?? trimmed;
}

export function resolvePortfolioPositionTradeHref(
  position: Pick<UserPositionRecord, "slug">,
  teams: ProphetTeamsConditionTeam[] = []
): string | undefined {
  const slug = position.slug?.trim();

  if (!slug) {
    return undefined;
  }

  if (isPortfolioGamePosition(position, teams)) {
    return gameTradeHref(resolveGameTradeSlug(slug));
  }

  return teamTradeHref(slug);
}
