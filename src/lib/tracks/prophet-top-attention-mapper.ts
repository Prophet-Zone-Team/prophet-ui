import {
  curatedAbbreviationToCode,
  findCuratedTeamByCode
} from "@/data/teams/curated-team-list";
import {
  extractFixtureTeamAbbreviations,
  parseTeamsFromTitle
} from "@/lib/market/prophet-game-mapper";
import {
  parseGammaArrayField,
  priceToProbability,
  toGammaNumber
} from "@/lib/market/polymarket-gamma";
import { mapProphetTrackToCardProps } from "@/lib/tracks/prophet-track-mapper";
import type {
  ProphetTopTracksData,
  ProphetTrackCategory,
  ProphetUserTrackItem,
  ProphetUserTrackMarket
} from "@/types/prophet-api";
import type { Team } from "@/types/market";
import type {
  TrackCardGameProps,
  TrackCardProps,
  TrackCardTeamProps
} from "@/views/tracks/track-card";
import type { TopAttentionCardProps } from "@/views/tracks/top-attention-card";

function parseNumericField(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function isDrawMarketTitle(title: string | undefined): boolean {
  const normalized = title?.trim().toLowerCase() ?? "";

  return normalized.startsWith("draw");
}

function resolveTeamsFromDrawMarket(
  markets: ProphetUserTrackMarket[] | undefined
): { homeName?: string; awayName?: string } {
  if (!markets?.length) {
    return {};
  }

  for (const market of markets) {
    const title = market.groupItemTitle?.trim() ?? "";

    if (!isDrawMarketTitle(title)) {
      continue;
    }

    const innerMatch = title.match(/\((.+)\)/);

    if (innerMatch?.[1]) {
      return parseTeamsFromTitle(innerMatch[1]);
    }

    return parseTeamsFromTitle(title.replace(/^draw\s*/i, ""));
  }

  return {};
}

function resolveTeamsFromFixtureSlug(
  slug: string | undefined
): { homeTeam?: Team; awayTeam?: Team } {
  const abbrevs = extractFixtureTeamAbbreviations(slug ?? "");
  const homeCode = abbrevs.homeAbbrev
    ? curatedAbbreviationToCode(abbrevs.homeAbbrev)
    : undefined;
  const awayCode = abbrevs.awayAbbrev
    ? curatedAbbreviationToCode(abbrevs.awayAbbrev)
    : undefined;

  if (!homeCode || !awayCode) {
    return {};
  }

  return {
    homeTeam: findCuratedTeamByCode(homeCode),
    awayTeam: findCuratedTeamByCode(awayCode)
  };
}

function enrichGameTrackItem(item: ProphetUserTrackItem): ProphetUserTrackItem {
  if (item.team_name?.trim()) {
    return item;
  }

  const fromSlug = resolveTeamsFromFixtureSlug(item.slug);
  if (fromSlug.homeTeam && fromSlug.awayTeam) {
    return {
      ...item,
      team_name: `${fromSlug.homeTeam.name},${fromSlug.awayTeam.name}`
    };
  }

  const fromDraw = resolveTeamsFromDrawMarket(item.markets);
  if (fromDraw.homeName && fromDraw.awayName) {
    return {
      ...item,
      team_name: `${fromDraw.homeName},${fromDraw.awayName}`
    };
  }

  return item;
}

function resolveHomeMoneylineMarket(
  item: ProphetUserTrackItem
): ProphetUserTrackMarket | undefined {
  const markets = item.markets ?? [];
  const fixtureSlug = item.slug?.trim() ?? "";
  const { homeAbbrev } = extractFixtureTeamAbbreviations(fixtureSlug);

  if (homeAbbrev && fixtureSlug) {
    const homeSuffix = `-${homeAbbrev.toLowerCase()}`;
    const homeMarket = markets.find((market) => {
      const slug = market.slug?.trim().toLowerCase() ?? "";

      return slug.endsWith(homeSuffix) && !slug.includes("-draw");
    });

    if (homeMarket) {
      return homeMarket;
    }
  }

  const nonDrawMarkets = markets.filter(
    (market) => !isDrawMarketTitle(market.groupItemTitle)
  );

  if (nonDrawMarkets.length === 0) {
    return markets[0];
  }

  return nonDrawMarkets.reduce((best, current) => {
    const bestVolume = parseNumericField(best.volume) ?? 0;
    const currentVolume = parseNumericField(current.volume) ?? 0;

    return currentVolume > bestVolume ? current : best;
  });
}

function resolveGameProbability(item: ProphetUserTrackItem): number {
  const fallbackProbability = parseNumericField(item.probobility) ?? 0;
  const market = resolveHomeMoneylineMarket(item);

  if (!market?.outcomePrices) {
    return fallbackProbability;
  }

  const prices = parseGammaArrayField(market.outcomePrices);
  const yesPrice = toGammaNumber(prices[0]);

  return priceToProbability(yesPrice) ?? fallbackProbability;
}

function resolveTopAttentionBadgeLabel(
  item: ProphetUserTrackItem,
  trackKind?: ProphetTrackCategory
): string | undefined {
  const category = item.category?.trim();

  if (!category) {
    return undefined;
  }

  if (trackKind !== undefined) {
    return category;
  }

  if (category === "team" || category === "game") {
    return undefined;
  }

  return category;
}

function prepareTopTrackItem(
  item: ProphetUserTrackItem,
  trackKind?: ProphetTrackCategory
): ProphetUserTrackItem {
  const isGame =
    trackKind === "game" ||
    (trackKind !== "team" &&
      (item.category === "game" || Boolean(item.slug?.match(/^(?:fifwc|ucl)-/i))));

  if (isGame) {
    const enriched = enrichGameTrackItem(item);
    const probability = resolveGameProbability(enriched);

    return {
      ...enriched,
      probobility: String(probability)
    };
  }

  return item;
}

function trackCardToTopAttentionCard(
  card: TrackCardProps,
  badgeLabel?: string,
  attention?: number
): TopAttentionCardProps | undefined {
  if (card.variant === "game") {
    return mapGameTrackCardToTopAttention(card, badgeLabel, attention);
  }

  return mapTeamTrackCardToTopAttention(
    card as TrackCardTeamProps,
    badgeLabel,
    attention
  );
}

function resolveTrackAttention(
  item: ProphetUserTrackItem
): number | undefined {
  const { attention } = item;

  if (attention === undefined || attention === null) {
    return undefined;
  }

  return Number.isFinite(attention) ? attention : undefined;
}

function mapTeamTrackCardToTopAttention(
  card: TrackCardTeamProps,
  badgeLabel?: string,
  attention?: number
): TopAttentionCardProps {
  return {
    snapshot: card.snapshot,
    ...(badgeLabel ? { badge: badgeLabel } : {}),
    ...(attention !== undefined ? { attention } : {})
  };
}

function mapGameTrackCardToTopAttention(
  card: TrackCardGameProps,
  badgeLabel?: string,
  attention?: number
): TopAttentionCardProps {
  return {
    variant: "match",
    match: card.match,
    homeTeam: card.homeTeam,
    awayTeam: card.awayTeam,
    probability: card.probability,
    volume: card.volume,
    ...(badgeLabel ? { badge: badgeLabel } : {}),
    ...(attention !== undefined ? { attention } : {})
  };
}

export function mapProphetTopTrackItemToCard(
  item: ProphetUserTrackItem,
  trackKind?: ProphetTrackCategory
): TopAttentionCardProps | undefined {
  const badgeLabel = resolveTopAttentionBadgeLabel(item, trackKind);
  const prepared = prepareTopTrackItem(item, trackKind);
  const trackCard = mapProphetTrackToCardProps(prepared);

  if (!trackCard) {
    return undefined;
  }

  const attention = resolveTrackAttention(prepared);
  const topCard = trackCardToTopAttentionCard(trackCard, badgeLabel, attention);

  if (topCard?.variant === "match") {
    return {
      ...topCard,
      probability: resolveGameProbability(prepared)
    };
  }

  return topCard;
}

export function mapProphetTopTracksToAttentionCards(
  data: ProphetTopTracksData | undefined
): TopAttentionCardProps[] {
  const cards: TopAttentionCardProps[] = [];

  for (const item of data?.teams_tracks ?? []) {
    const card = mapProphetTopTrackItemToCard(item, "team");

    if (card) {
      cards.push(card);
    }
  }

  for (const item of data?.game_tracks ?? []) {
    const card = mapProphetTopTrackItemToCard(item, "game");

    if (card) {
      cards.push(card);
    }
  }

  return cards;
}
