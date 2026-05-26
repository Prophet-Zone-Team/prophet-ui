import { worldCupTeams } from "@/data/teams/world-cup-teams";
import {
  firstGammaNumber,
  normalizeGammaSearchText,
  parseGammaArrayField,
  priceToProbability,
  toGammaNumber,
  type GammaEventRecord,
  type GammaMarketRecord,
} from "@/lib/market/polymarket-gamma";
import {
  mapEventSportsMarkets,
} from "@/lib/market/fixture-markets-mapper";
import type {
  MatchOddsOutcome,
  MatchOutcomeSide,
  PolymarketFixtureMetadata,
  Team,
  WorldCupMatch,
  WorldCupMatchStatus,
} from "@/types/market";

/** Polymarket FIFA World Cup fixture tags (see /public-search and tag 102232 events). */
export const FIFA_WORLD_CUP_FIXTURE_TAG_IDS = ["102232", "102350"] as const;

export function resolveWorldCupTagIds(
  sports: Array<{ sport?: string; tags?: string; series?: string }>,
): string[] {
  const tagIds = new Set<string>(FIFA_WORLD_CUP_FIXTURE_TAG_IDS);

  for (const record of sports) {
    const sportCode = normalizeGammaSearchText(record.sport ?? "");
    const seriesText = normalizeGammaSearchText(record.series ?? "");

    if (!sportCode && !seriesText) {
      continue;
    }

    if (!isWorldCupSportText(`${sportCode} ${seriesText}`, sportCode)) {
      continue;
    }

    for (const tagId of parseTagIds(record.tags)) {
      tagIds.add(tagId);
    }
  }

  return [...tagIds];
}

export function isWorldCupFixtureEvent(event: GammaEventRecord): boolean {
  const title = event.title ?? "";
  const slug = event.slug ?? "";

  if (slug.startsWith("fifwc-")) {
    return true;
  }

  if (/\bvs\.?\b|\bv\b/i.test(title)) {
    return !isWorldCupOutrightEventText(title, slug);
  }

  return false;
}

export function isWorldCupEvent(event: GammaEventRecord): boolean {
  if (isWorldCupFixtureEvent(event)) {
    return true;
  }

  const tagLabels =
    event.tags?.map((tag) => tag.label ?? tag.slug ?? "").join(" ") ?? "";
  const seriesTitles =
    event.series?.map((series) => series.title ?? series.slug ?? "").join(" ") ?? "";
  const text = normalizeGammaSearchText(
    `${event.title ?? ""} ${event.subtitle ?? ""} ${event.slug ?? ""} ${tagLabels} ${seriesTitles}`,
  );

  if (text.includes("world cup")) {
    return true;
  }

  return text.includes("fifa") && text.includes("2026");
}

function isWorldCupOutrightEventText(title: string, slug: string): boolean {
  const text = normalizeGammaSearchText(`${title} ${slug}`);
  return (
    text.includes("world cup winner") ||
    text.includes("top goalscorer") ||
    text.includes("group winner") ||
    text.includes("reach final") ||
    text.includes("knockout stages")
  );
}

export function mapGammaEventsToMatches(events: GammaEventRecord[]): WorldCupMatch[] {
  const matches: WorldCupMatch[] = [];

  for (const event of events) {
    const match = mapGammaEventToMatch(event);

    if (match) {
      matches.push(match);
    }
  }

  return matches.sort((left, right) => {
    const leftVolume = left.polymarket?.volume ?? 0;
    const rightVolume = right.polymarket?.volume ?? 0;

    if (rightVolume !== leftVolume) {
      return rightVolume - leftVolume;
    }

    return getKickoffTime(right) - getKickoffTime(left);
  });
}

export function mapGammaEventToMatch(event: GammaEventRecord): WorldCupMatch | undefined {
  if (!isWorldCupFixtureEvent(event)) {
    return undefined;
  }

  const sides = resolveFixtureSides(event);

  if (!sides.homeName || !sides.awayName) {
    return undefined;
  }

  const homeTeam = findWorldCupTeamByName(sides.homeName);
  const awayTeam = findWorldCupTeamByName(sides.awayName);
  const eventId = String(event.id ?? event.slug ?? sides.homeName);
  const slug = event.slug ?? `pm-${eventId}`;
  const moneylineMarkets = getFixtureMoneylineMarkets(event.markets ?? []);
  const outcomes = buildFixtureMoneylineOutcomes(
    moneylineMarkets,
    sides.homeName,
    sides.awayName,
  );

  if (outcomes.length < 3) {
    return undefined;
  }

  const volume =
    firstGammaNumber(event.volume, event.volume24hr) ??
    moneylineMarkets.reduce(
      (sum, market) => sum + (firstGammaNumber(market.volumeNum, market.volume) ?? 0),
      0,
    );
  const volume24hr = firstGammaNumber(event.volume24hr);
  const updatedAt =
    moneylineMarkets.find((market) => market.updatedAt)?.updatedAt ??
    event.startTime ??
    event.startDate ??
    new Date().toISOString();
  const kickoffAt = event.startTime ?? event.startDate;
  const oddsOutcomes = outcomes.map(
    (outcome): MatchOddsOutcome => ({
      label: outcome.label,
      impliedProbability: outcome.probability / 100,
      lastUpdated: updatedAt,
    }),
  );

  return {
    id: slug,
    matchId: hashEventId(eventId),
    stage: "GROUP",
    group: homeTeam?.group,
    homeTeamId: homeTeam?.id,
    awayTeamId: awayTeam?.id,
    homeDisplayName: sides.homeName,
    awayDisplayName: sides.awayName,
    homeSeed: homeTeam ? undefined : sides.homeName,
    awaySeed: awayTeam ? undefined : sides.awayName,
    homeScore: sides.homeScore,
    awayScore: sides.awayScore,
    status: mapEventStatus(event),
    kickoffAt,
    league: resolveLeagueLabel(event) ?? "FIFA World Cup",
    odds: {
      source: "polymarket",
      status: "live",
      outcomes: oddsOutcomes,
      lastUpdated: updatedAt,
    },
    freshness: {
      source: "polymarket-gamma",
      status: "live",
      lastUpdated: updatedAt,
    },
    polymarket: {
      eventId,
      slug,
      league: resolveLeagueLabel(event),
      volume,
      volume24hr,
      moneyline: {
        conditionId: moneylineMarkets[0]?.conditionId,
        acceptingOrders: moneylineMarkets.some((market) => market.acceptingOrders === true),
        outcomes,
      },
      fixtureMarkets: mapEventSportsMarkets(
        event.markets ?? [],
        sides.homeName,
        sides.awayName,
        outcomes,
      ),
    },
  };
}

export function findMoneylineMarket(
  markets: GammaMarketRecord[],
): GammaMarketRecord | undefined {
  return getFixtureMoneylineMarkets(markets)[0];
}

function getFixtureMoneylineMarkets(markets: GammaMarketRecord[]): GammaMarketRecord[] {
  return markets.filter(isFixtureMoneylineMarket);
}

function isFixtureMoneylineMarket(market: GammaMarketRecord): boolean {
  if (market.acceptingOrders !== true) {
    return false;
  }

  const marketType = normalizeGammaSearchText(market.sportsMarketType ?? "");

  if (marketType !== "moneyline" && marketType !== "ml") {
    return false;
  }

  return parseGammaArrayField(market.clobTokenIds).map(String).filter(Boolean).length >= 2;
}

function buildFixtureMoneylineOutcomes(
  markets: GammaMarketRecord[],
  homeName: string,
  awayName: string,
): PolymarketFixtureMetadata["moneyline"]["outcomes"] {
  const outcomes: PolymarketFixtureMetadata["moneyline"]["outcomes"] = [];

  for (const market of markets) {
    const question = market.question ?? "";
    const normalizedQuestion = normalizeGammaSearchText(question);
    const yesOutcome = getYesMarketOutcome(market);
    const noOutcome = getNoMarketOutcome(market);

    if (!yesOutcome.tokenId) {
      continue;
    }

    if (
      normalizedQuestion.includes("end in a draw") ||
      (normalizedQuestion.includes("draw") && normalizedQuestion.includes(" vs "))
    ) {
      outcomes.push({
        side: "draw",
        label: "Draw",
        tokenId: yesOutcome.tokenId,
        noTokenId: noOutcome.tokenId,
        conditionId: market.conditionId,
        probability: yesOutcome.probability,
        volume: yesOutcome.volume,
      });
      continue;
    }

    const winningTeam = extractWinningTeamFromQuestion(question);

    if (!winningTeam) {
      continue;
    }

    const side = classifyTeamSide(winningTeam, homeName, awayName);

    if (!side || side === "draw") {
      continue;
    }

    outcomes.push({
      side,
      label: winningTeam,
      tokenId: yesOutcome.tokenId,
      noTokenId: noOutcome.tokenId,
      conditionId: market.conditionId,
      probability: yesOutcome.probability,
      volume: yesOutcome.volume,
    });
  }

  return outcomes;
}

function getYesMarketOutcome(market: GammaMarketRecord): {
  tokenId?: string;
  probability: number;
  volume?: number;
} {
  const outcomes = parseGammaArrayField(market.outcomes).map(String);
  const prices = parseGammaArrayField(market.outcomePrices);
  const tokenIds = parseGammaArrayField(market.clobTokenIds).map(String);
  const yesIndex = outcomes.findIndex((outcome) => outcome.toLowerCase() === "yes");
  const index = yesIndex >= 0 ? yesIndex : 0;

  return {
    tokenId: tokenIds[index],
    probability: priceToProbability(toGammaNumber(prices[index])) ?? 0,
    volume: firstGammaNumber(market.volumeNum, market.volume),
  };
}

function getNoMarketOutcome(market: GammaMarketRecord): {
  tokenId?: string;
  probability: number;
} {
  const outcomes = parseGammaArrayField(market.outcomes).map(String);
  const prices = parseGammaArrayField(market.outcomePrices);
  const tokenIds = parseGammaArrayField(market.clobTokenIds).map(String);
  const noIndex = outcomes.findIndex((outcome) => outcome.toLowerCase() === "no");
  const index = noIndex >= 0 ? noIndex : 1;

  return {
    tokenId: tokenIds[index],
    probability: priceToProbability(toGammaNumber(prices[index])) ?? 0,
  };
}

function extractWinningTeamFromQuestion(question: string): string | undefined {
  const match = question.match(/^Will\s+(.+?)\s+win\b/i);
  return match?.[1]?.trim();
}

function classifyTeamSide(
  teamLabel: string,
  homeName: string,
  awayName: string,
): MatchOutcomeSide | undefined {
  const homeTeam = findWorldCupTeamByName(homeName);
  const awayTeam = findWorldCupTeamByName(awayName);
  const labelTeam = findWorldCupTeamByName(teamLabel);

  if (labelTeam && homeTeam && labelTeam.id === homeTeam.id) {
    return "home";
  }

  if (labelTeam && awayTeam && labelTeam.id === awayTeam.id) {
    return "away";
  }

  return classifyOutcomeSide(teamLabel, homeName, awayName);
}

function resolveFixtureSides(event: GammaEventRecord): {
  homeName?: string;
  awayName?: string;
  homeScore?: number;
  awayScore?: number;
} {
  const parsedFromTitle = parseTeamsFromTitle(event.title ?? "");

  return {
    ...parsedFromTitle,
    ...parseScore(event.score),
  };
}

function classifyOutcomeSide(
  label: string,
  homeName: string,
  awayName: string,
): MatchOutcomeSide | undefined {
  const normalized = normalizeGammaSearchText(label);
  const home = normalizeGammaSearchText(homeName);
  const away = normalizeGammaSearchText(awayName);

  if (["draw", "tie", "x", "d"].includes(normalized) || normalized.includes("draw")) {
    return "draw";
  }

  if (normalized === home || normalized.includes(home) || home.includes(normalized)) {
    return "home";
  }

  if (normalized === away || normalized.includes(away) || away.includes(normalized)) {
    return "away";
  }

  return undefined;
}

function parseTeamsFromTitle(title: string): { homeName?: string; awayName?: string } {
  const parts = title.split(/\s+vs\.?\s+|\s+v\s+/i);

  if (parts.length !== 2) {
    return {};
  }

  return {
    homeName: parts[0]?.trim(),
    awayName: parts[1]?.trim(),
  };
}

function parseScore(score: string | undefined): { homeScore?: number; awayScore?: number } {
  if (!score) {
    return {};
  }

  const match = score.match(/(\d+)\s*[-:]\s*(\d+)/);

  if (!match) {
    return {};
  }

  return {
    homeScore: Number(match[1]),
    awayScore: Number(match[2]),
  };
}

function mapEventStatus(event: GammaEventRecord): WorldCupMatchStatus {
  const status = normalizeGammaSearchText(`${event.gameStatus ?? ""} ${event.period ?? ""}`);

  if (event.live === true || status.includes("live") || status.includes("progress")) {
    return "live";
  }

  if (status.includes("final") || status.includes("finished") || status.includes("ended")) {
    return "finished";
  }

  if (status.includes("postpon")) {
    return "postponed";
  }

  if (status.includes("cancel")) {
    return "cancelled";
  }

  if (event.closed === true) {
    return "finished";
  }

  return "scheduled";
}

function resolveLeagueLabel(event: GammaEventRecord): string | undefined {
  return (
    event.series?.[0]?.title ??
    event.subtitle ??
    event.tags?.find((tag) => tag.label)?.label ??
    undefined
  );
}

function findWorldCupTeamByName(name: string): Team | undefined {
  const normalized = normalizeGammaSearchText(name);

  return worldCupTeams.find((team) => {
    const aliases = [team.name, team.code, ...(team.aliases ?? [])].map(normalizeGammaSearchText);
    return aliases.some(
      (alias) =>
        alias &&
        (normalized === alias ||
          normalized.includes(alias) ||
          alias.includes(normalized)),
    );
  });
}

function parseTagIds(tags: string | undefined): string[] {
  if (!tags) {
    return [];
  }

  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function isWorldCupSportText(text: string, sportCode?: string): boolean {
  if (text.includes("world cup")) {
    return true;
  }

  if (sportCode === "fifa" && !text.includes("world cup")) {
    return false;
  }

  return text.includes("fifa") && text.includes("2026");
}

function hashEventId(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash % 1_000_000 || 1;
}

function getKickoffTime(match: WorldCupMatch): number {
  if (!match.kickoffAt) {
    return Number.NEGATIVE_INFINITY;
  }

  const time = Date.parse(match.kickoffAt);
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}
