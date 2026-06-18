import type { GammaMarketRecord } from "@/lib/market/polymarket-gamma";
import type {
  PortfolioMarketKind,
  ProphetTeamsConditionEntry,
  ProphetTeamsConditionTeam
} from "@/types/prophet-api";

export type { PortfolioMarketKind };

const GROUP_WINNER_EVENT_SLUG_PATTERN =
  /^world-cup-group-[a-l]-winner$/i;

function readEventSlug(market: GammaMarketRecord): string {
  return market.events?.[0]?.slug?.trim() ?? "";
}

function readEventGameId(market: GammaMarketRecord): string | number | undefined {
  const event = market.events?.[0];

  if (!event || typeof event !== "object") {
    return undefined;
  }

  const gameId = (event as { gameId?: string | number }).gameId;

  if (typeof gameId === "string" || typeof gameId === "number") {
    return gameId;
  }

  return undefined;
}

export function classifyGammaPortfolioMarket(
  market: GammaMarketRecord
): PortfolioMarketKind {
  const eventSlug = readEventSlug(market);

  if (
    market.sportsMarketType === "moneyline" ||
    eventSlug.startsWith("fifwc-") ||
    readEventGameId(market) !== undefined
  ) {
    return "game";
  }

  if (GROUP_WINNER_EVENT_SLUG_PATTERN.test(eventSlug)) {
    return "group";
  }

  return "team";
}

function buildTeams(groupItemTitle?: string, icon?: string): ProphetTeamsConditionTeam[] {
  const name = groupItemTitle?.trim();

  if (!name) {
    return [];
  }

  return [
    {
      name,
      ...(icon ? { logo: icon } : {})
    }
  ];
}

function resolveEntrySlug(
  market: GammaMarketRecord,
  marketKind: PortfolioMarketKind
): string {
  const eventSlug = readEventSlug(market);
  const marketSlug = market.slug?.trim() ?? "";

  if (marketKind === "game") {
    return eventSlug || marketSlug;
  }

  if (marketKind === "group") {
    return eventSlug || marketSlug;
  }

  return marketSlug || eventSlug;
}

export function mapGammaMarketToTeamsConditionEntry(
  market: GammaMarketRecord
): ProphetTeamsConditionEntry | undefined {
  const conditionId = market.conditionId?.trim();

  if (!conditionId) {
    return undefined;
  }

  const marketKind = classifyGammaPortfolioMarket(market);
  const icon = market.icon?.trim() || market.image?.trim() || undefined;
  const groupItemTitle = market.groupItemTitle?.trim();
  const event = market.events?.[0];

  return {
    teams: buildTeams(groupItemTitle, icon),
    slug: resolveEntrySlug(market, marketKind),
    question: market.question?.trim() || undefined,
    main_event_title: event?.title?.trim() || undefined,
    event_title: event?.title?.trim() || undefined,
    icon,
    marketKind
  };
}

export function mapGammaMarketsToTeamsConditionData(
  markets: GammaMarketRecord[]
): Record<string, ProphetTeamsConditionEntry> {
  const data: Record<string, ProphetTeamsConditionEntry> = {};

  for (const market of markets) {
    const entry = mapGammaMarketToTeamsConditionEntry(market);
    const conditionId = market.conditionId?.trim();

    if (!entry || !conditionId) {
      continue;
    }

    data[conditionId] = entry;
  }

  return data;
}

export function parseGroupLetterFromEventSlug(
  eventSlug: string
): string | undefined {
  const match = eventSlug
    .trim()
    .toLowerCase()
    .match(/^world-cup-group-([a-l])-winner$/);

  return match?.[1]?.toUpperCase();
}
