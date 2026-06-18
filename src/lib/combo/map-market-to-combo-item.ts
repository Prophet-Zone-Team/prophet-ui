import type { ComboMarketRecord } from "@/types/combo";
import { getLocalizedTeamName } from "@/lib/i18n/localized-team-name";
import type {
  ComboItemProps,
  ComboItemTeam,
  ComboOddsOption,
} from "@/views/combo/combo-item/types";
import type { ComboPickOutcomeSide } from "@/views/combo/combo-widget/types";

export type ComboCatalogMarketKind = "moneyline" | "total" | "unknown";

export interface ComboMarketSlugMeta {
  homeCode: string;
  awayCode: string;
  kickoffLabel: string;
  marketKind: ComboCatalogMarketKind;
  pickCode?: string;
  totalLine?: string;
}

export function buildComboMarketOddsId(
  marketId: string,
  outcomeSide: ComboPickOutcomeSide,
): string {
  return `${marketId}:${outcomeSide}`;
}

export function parseComboMarketOddsId(
  oddsId: string,
): { marketId: string; outcomeSide: ComboPickOutcomeSide } | undefined {
  const separatorIndex = oddsId.lastIndexOf(":");

  if (separatorIndex <= 0) {
    return undefined;
  }

  const marketId = oddsId.slice(0, separatorIndex);
  const outcomeSide = oddsId.slice(separatorIndex + 1);

  if (outcomeSide !== "yes" && outcomeSide !== "no") {
    return undefined;
  }

  return { marketId, outcomeSide };
}

export function parseComboMarketSlug(slug: string): ComboMarketSlugMeta {
  const match = slug.match(
    /^fifwc-([a-z]+)-([a-z]+)-(\d{4})-(\d{2})-(\d{2})-(.+)$/i,
  );

  if (!match) {
    return {
      homeCode: "home",
      awayCode: "away",
      kickoffLabel: "TBD",
      marketKind: "unknown",
    };
  }

  const [, homeCode, awayCode, year, month, day, suffix] = match;
  const kickoffLabel = `${year}-${month}-${day}`;
  const normalizedHome = homeCode.toLowerCase();
  const normalizedAway = awayCode.toLowerCase();
  const totalMatch = suffix.match(/^total-(\d+)pt(\d+)$/i);

  if (totalMatch) {
    return {
      homeCode: normalizedHome,
      awayCode: normalizedAway,
      kickoffLabel,
      marketKind: "total",
      totalLine: `${totalMatch[1]}.${totalMatch[2]}`,
    };
  }

  return {
    homeCode: normalizedHome,
    awayCode: normalizedAway,
    kickoffLabel,
    marketKind: "moneyline",
    pickCode: suffix.toLowerCase(),
  };
}

export function mapComboMarketToItemProps(
  market: ComboMarketRecord,
  options?: {
    selectedOutcomeSide?: ComboPickOutcomeSide;
    isInCombo?: boolean;
  },
): ComboItemProps {
  const meta = parseComboMarketSlug(market.slug);
  const homeTeam = toComboItemTeam(meta.homeCode, market.image);
  const awayTeam = toComboItemTeam(meta.awayCode);
  const primaryOdds = buildPrimaryOdds(market, meta);

  return {
    kickoffLabel: meta.kickoffLabel,
    homeTeam,
    awayTeam,
    moneylineOdds: primaryOdds,
    spreadOdds: [],
    topScoreOdds: [],
    totalOdds: [],
    selectedOddsId:
      options?.isInCombo && options.selectedOutcomeSide
        ? buildComboMarketOddsId(market.id, options.selectedOutcomeSide)
        : null,
    defaultExpanded: options?.isInCombo,
  };
}

export function resolveComboMarketTeamCodes(market: ComboMarketRecord) {
  const meta = parseComboMarketSlug(market.slug);

  if (meta.marketKind === "moneyline" && meta.pickCode) {
    const teamCode = meta.pickCode.toUpperCase();

    return {
      teamCode,
      teamName: getLocalizedTeamName(teamCode, teamCode),
    };
  }

  if (meta.marketKind === "total") {
    return {
      teamCode: "O/U",
      teamName: market.title,
    };
  }

  return {
    teamCode: market.id.slice(0, 6).toUpperCase(),
    teamName: market.title,
  };
}

function buildPrimaryOdds(
  market: ComboMarketRecord,
  meta: ComboMarketSlugMeta,
): ComboOddsOption[] {
  const yesPrice = Number.parseFloat(market.outcomePrices[0]);
  const noPrice = Number.parseFloat(market.outcomePrices[1]);

  return [
    {
      id: buildComboMarketOddsId(market.id, "yes"),
      label: formatOutcomeLabel(meta, market.outcomes[0], 0),
      price: Number.isFinite(yesPrice) ? yesPrice : 0,
    },
    {
      id: buildComboMarketOddsId(market.id, "no"),
      label: formatOutcomeLabel(meta, market.outcomes[1], 1),
      price: Number.isFinite(noPrice) ? noPrice : 0,
    },
  ];
}

function formatOutcomeLabel(
  meta: ComboMarketSlugMeta,
  outcome: string,
  index: number,
): string {
  const normalizedOutcome = outcome?.trim() || (index === 0 ? "Yes" : "No");

  if (meta.marketKind === "moneyline" && meta.pickCode) {
    const teamName = getLocalizedTeamName(
      meta.pickCode.toUpperCase(),
      meta.pickCode.toUpperCase(),
    );

    return `${teamName} ${normalizedOutcome}`;
  }

  if (meta.marketKind === "total" && meta.totalLine) {
    return `${normalizedOutcome} ${meta.totalLine}`;
  }

  return normalizedOutcome;
}

function toComboItemTeam(code: string, logoUrl?: string): ComboItemTeam {
  const teamCode = code.toUpperCase();

  return {
    name: getLocalizedTeamName(teamCode, teamCode),
    code: teamCode,
    logoUrl,
  };
}
