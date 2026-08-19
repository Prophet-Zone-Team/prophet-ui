import { getFixtureOutcomesForGroup } from "@/lib/market/build-fixture-markets-snapshot";
import { extractFixtureTeamAbbreviations } from "@/lib/market/prophet-game-mapper";
import { formatScheduleKickoff } from "@/lib/market/schedule-match";
import type {
  FixtureMarketGroup,
  FixtureMarketOutcome,
  WorldCupMatch
} from "@/types/market";
import type {
  MarketItemProps,
  MarketItemTeam,
  MarketOddsOption
} from "@/views/markets/content/market-item/types";

function resolveTeamCode(
  displayName: string | undefined,
  abbrev: string | undefined,
  fallback: string
): string {
  if (abbrev?.trim()) {
    return abbrev.trim().toUpperCase();
  }

  const normalized = displayName?.trim();

  if (!normalized) {
    return fallback;
  }

  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return words
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("");
  }

  return normalized.slice(0, 3).toUpperCase();
}

function toMarketItemTeam(
  name: string | undefined,
  code: string,
  logoUrl?: string
): MarketItemTeam {
  return {
    name: name?.trim() || code,
    code,
    logoUrl
  };
}

function toMarketOddsOption(
  matchId: string,
  prefix: string,
  outcome: FixtureMarketOutcome | { id?: string; label: string; price?: number; impliedProbability?: number },
  index: number
): MarketOddsOption | undefined {
  const label = outcome.label?.trim();

  if (!label) {
    return undefined;
  }

  const price =
    "price" in outcome && typeof outcome.price === "number"
      ? outcome.price
      : "impliedProbability" in outcome &&
          typeof outcome.impliedProbability === "number"
        ? outcome.impliedProbability
        : undefined;

  if (price === undefined) {
    return undefined;
  }

  const id =
    "id" in outcome && outcome.id
      ? `${matchId}:${prefix}:${outcome.id}`
      : `${matchId}:${prefix}:${index}`;

  return { id, label, price };
}

function mapFixtureOutcomes(
  matchId: string,
  prefix: string,
  outcomes: FixtureMarketOutcome[]
): MarketOddsOption[] {
  return outcomes.flatMap((outcome, index) => {
    const option = toMarketOddsOption(matchId, prefix, outcome, index);
    return option ? [option] : [];
  });
}

function mapGroupOutcomes(
  matchId: string,
  prefix: string,
  group: FixtureMarketGroup
): MarketOddsOption[] {
  return mapFixtureOutcomes(
    matchId,
    prefix,
    getFixtureOutcomesForGroup(group)
  );
}

function mapMoneylineOdds(match: WorldCupMatch): MarketOddsOption[] {
  const fixtureMoneyline = match.polymarket?.fixtureMarkets?.lines.find(
    (group) => group.type === "moneyline"
  );

  if (fixtureMoneyline) {
    return mapGroupOutcomes(match.id, "ml", fixtureMoneyline);
  }

  const outcomes = match.odds?.outcomes ?? [];

  return outcomes.flatMap((outcome, index) => {
    const option = toMarketOddsOption(match.id, "ml", outcome, index);
    return option ? [option] : [];
  });
}

function mapSpreadOdds(match: WorldCupMatch): MarketOddsOption[] {
  const groups =
    match.polymarket?.fixtureMarkets?.lines.filter(
      (group) => group.type === "spread"
    ) ?? [];

  return groups.flatMap((group) => mapGroupOutcomes(match.id, "spread", group));
}

function mapTotalOdds(match: WorldCupMatch): MarketOddsOption[] {
  const groups =
    match.polymarket?.fixtureMarkets?.lines.filter(
      (group) => group.type === "total"
    ) ?? [];

  return groups.flatMap((group) => mapGroupOutcomes(match.id, "total", group));
}

function mapTopScoreOdds(match: WorldCupMatch): MarketOddsOption[] {
  return mapFixtureOutcomes(
    match.id,
    "score",
    match.polymarket?.fixtureMarkets?.exactScores ?? []
  );
}

export function mapMatchToMarketItemProps(match: WorldCupMatch): MarketItemProps {
  const abbrevs = extractFixtureTeamAbbreviations(
    match.polymarket?.slug ?? match.id
  );
  const moneylineOdds = mapMoneylineOdds(match);
  const spreadOdds = mapSpreadOdds(match);
  const topScoreOdds = mapTopScoreOdds(match);
  const totalOdds = mapTotalOdds(match);

  return {
    matchId: match.id,
    kickoffLabel: formatScheduleKickoff(match.kickoffAt),
    isLive: match.status === "live",
    homeTeam: toMarketItemTeam(
      match.homeDisplayName,
      resolveTeamCode(match.homeDisplayName, abbrevs.homeAbbrev, "HOM"),
      match.homeLogoUrl
    ),
    awayTeam: toMarketItemTeam(
      match.awayDisplayName,
      resolveTeamCode(match.awayDisplayName, abbrevs.awayAbbrev, "AWY"),
      match.awayLogoUrl
    ),
    moneylineOdds,
    spreadOdds,
    topScoreOdds,
    totalOdds,
    totalOddsCount:
      moneylineOdds.length +
      spreadOdds.length +
      topScoreOdds.length +
      totalOdds.length
  };
}
