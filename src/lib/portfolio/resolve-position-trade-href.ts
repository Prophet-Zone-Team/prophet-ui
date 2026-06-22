import { curatedTeamsById } from "@/data/teams/curated-team-list";
import { groupDetailHref } from "@/lib/routes/group";
import { gameTradeHref, teamTradeHref } from "@/lib/routes/trade";
import { parseGroupLetterFromEventSlug } from "@/lib/portfolio/map-gamma-portfolio-market";
import type {
  PortfolioMarketKind,
  ProphetTeamsConditionTeam
} from "@/types/prophet-api";
import type {
  PortfolioTransactionRecord,
  PortfolioTransactionType
} from "@/lib/portfolio/types";
import type { UserPositionRecord } from "@/types/market";
import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";

const NON_LINKABLE_TRANSACTION_TYPES = new Set<PortfolioTransactionType>([
  "withdraw",
  "deposit",
  "claim",
  "activity"
]);

const FIXTURE_SLUG_PATTERN = /^(.+\d{4}-\d{2}-\d{2})(?:-.+)?$/;

export type PortfolioPositionTradeContext = {
  marketKind?: PortfolioMarketKind;
  contextSlug?: string;
  teams?: ProphetTeamsConditionTeam[];
};

type PortfolioTradeSlugSource = Pick<UserPositionRecord, "slug" | "eventSlug">;

function readSlug(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function resolvePortfolioTradeSlug(
  position: PortfolioTradeSlugSource,
  context: Pick<PortfolioPositionTradeContext, "marketKind" | "contextSlug"> = {}
): string {
  const positionSlug = readSlug(position.slug);
  const eventSlug = readSlug(position.eventSlug);
  const contextSlug = readSlug(context.contextSlug);
  const marketKind = context.marketKind;

  if (marketKind === "group" || marketKind === "game") {
    return contextSlug || eventSlug || positionSlug;
  }

  if (marketKind === "team") {
    return positionSlug || contextSlug;
  }

  if (eventSlug && parseGroupLetterFromEventSlug(eventSlug)) {
    return eventSlug;
  }

  return positionSlug || contextSlug || eventSlug;
}

export function isPortfolioGamePosition(
  position: Pick<UserPositionRecord, "slug" | "eventSlug">,
  context: PortfolioPositionTradeContext = {}
): boolean {
  if (context.marketKind === "game") {
    return true;
  }

  if (
    context.marketKind === "team" ||
    context.marketKind === "group"
  ) {
    return false;
  }

  const slug = position.slug?.trim();

  if (!slug) {
    return false;
  }

  if (curatedTeamsById.has(slug)) {
    return false;
  }

  return FIXTURE_SLUG_PATTERN.test(slug);
}

function resolveGameTradeSlug(slug: string): string {
  const trimmed = slug.trim();
  const match = trimmed.match(FIXTURE_SLUG_PATTERN);

  return match?.[1] ?? trimmed;
}

function resolveGroupTradeHref(slugCandidates: string[]): string | undefined {
  for (const candidate of slugCandidates) {
    const groupLetter = parseGroupLetterFromEventSlug(candidate);

    if (groupLetter) {
      return groupDetailHref(groupLetter as WorldCup2026Group);
    }
  }

  return undefined;
}

export function resolvePortfolioPositionTradeHref(
  position: PortfolioTradeSlugSource,
  context: PortfolioPositionTradeContext = {}
): string | undefined {
  const marketKind = context.marketKind;
  const slugCandidates = [
    readSlug(context.contextSlug),
    readSlug(position.eventSlug),
    readSlug(position.slug)
  ].filter((slug, index, slugs) => slug && slugs.indexOf(slug) === index);

  if (marketKind === "group") {
    return resolveGroupTradeHref(slugCandidates);
  }

  if (!marketKind) {
    const groupHref = resolveGroupTradeHref([
      readSlug(context.contextSlug),
      readSlug(position.eventSlug)
    ]);

    if (groupHref) {
      return groupHref;
    }
  }

  const resolvedSlug = resolvePortfolioTradeSlug(position, context);

  if (isPortfolioGamePosition(position, context)) {
    if (!resolvedSlug) {
      return undefined;
    }

    return gameTradeHref(resolveGameTradeSlug(resolvedSlug));
  }

  if (!resolvedSlug) {
    return undefined;
  }

  return teamTradeHref(resolvedSlug);
}

export function resolvePortfolioTransactionTradeHref(
  transaction: Pick<
    PortfolioTransactionRecord,
    "type" | "slug" | "eventSlug"
  >
): string | undefined {
  if (NON_LINKABLE_TRANSACTION_TYPES.has(transaction.type)) {
    return undefined;
  }

  const slug = readSlug(transaction.slug);
  const eventSlug = readSlug(transaction.eventSlug);

  if (!slug && !eventSlug) {
    return undefined;
  }

  const groupHref = resolveGroupTradeHref([eventSlug, slug]);

  if (groupHref) {
    return groupHref;
  }

  const href = resolvePortfolioPositionTradeHref({ slug, eventSlug });

  if (href?.startsWith("/trade/") || href?.startsWith("/group")) {
    return href;
  }

  return undefined;
}
