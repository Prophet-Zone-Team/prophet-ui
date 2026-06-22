import type { ComboGameGroup, ComboMarketRecord } from "@/types/combo";
import { findCuratedTeamByCode } from "@/data/teams/curated-team-list";
import { getLocalizedTeamName } from "@/lib/i18n/localized-team-name";
import type {
  ComboItemProps,
  ComboItemTeam,
  ComboOddsOption,
} from "@/views/combo/combo-item/types";
import type { ComboPickOutcomeSide } from "@/views/combo/combo-widget/types";

export type ComboCatalogMarketKind =
  | "moneyline"
  | "halftime"
  | "btts"
  | "total"
  | "spread"
  | "exact_score"
  | "unknown";

export interface ComboMarketSlugMeta {
  homeCode: string;
  awayCode: string;
  kickoffLabel: string;
  marketKind: ComboCatalogMarketKind;
  pickCode?: string;
  totalLine?: string;
  scoreLabel?: string;
  /** Distinguishes full-match, half, and team totals for labeling and previews. */
  totalVariant?: "match" | "half" | "team" | "half-team";
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
  const normalizedSuffix = suffix.toLowerCase();

  if (normalizedSuffix.startsWith("exact-score-")) {
    const scoreSuffix = normalizedSuffix.slice("exact-score-".length);

    return {
      homeCode: normalizedHome,
      awayCode: normalizedAway,
      kickoffLabel,
      marketKind: "exact_score",
      scoreLabel: formatExactScoreLabel(scoreSuffix),
    };
  }

  if (normalizedSuffix.includes("spread")) {
    return {
      homeCode: normalizedHome,
      awayCode: normalizedAway,
      kickoffLabel,
      marketKind: "spread",
      pickCode: normalizedSuffix,
    };
  }

  if (normalizedSuffix.startsWith("halftime-result-")) {
    return {
      homeCode: normalizedHome,
      awayCode: normalizedAway,
      kickoffLabel,
      marketKind: "halftime",
      pickCode: normalizedSuffix.slice("halftime-result-".length),
    };
  }

  if (normalizedSuffix === "btts" || normalizedSuffix.startsWith("btts-")) {
    return {
      homeCode: normalizedHome,
      awayCode: normalizedAway,
      kickoffLabel,
      marketKind: "btts",
      pickCode: normalizedSuffix,
    };
  }

  const totalMeta = parseTotalMarketMeta(
    normalizedSuffix,
    normalizedHome,
    normalizedAway,
    kickoffLabel,
  );

  if (totalMeta) {
    return totalMeta;
  }

  if (
    normalizedSuffix === "draw" ||
    normalizedSuffix === normalizedHome ||
    normalizedSuffix === normalizedAway
  ) {
    return {
      homeCode: normalizedHome,
      awayCode: normalizedAway,
      kickoffLabel,
      marketKind: "moneyline",
      pickCode: normalizedSuffix,
    };
  }

  return {
    homeCode: normalizedHome,
    awayCode: normalizedAway,
    kickoffLabel,
    marketKind: "unknown",
    pickCode: normalizedSuffix,
  };
}

function parseTotalMarketMeta(
  normalizedSuffix: string,
  homeCode: string,
  awayCode: string,
  kickoffLabel: string,
): ComboMarketSlugMeta | undefined {
  const lineMatch = normalizedSuffix.match(/(\d+)pt(\d+)$/);

  if (!lineMatch) {
    return undefined;
  }

  const totalLine = `${lineMatch[1]}.${lineMatch[2]}`;
  const base = { homeCode, awayCode, kickoffLabel, marketKind: "total" as const, totalLine };

  if (/^total-\d+pt\d+$/.test(normalizedSuffix)) {
    return { ...base, pickCode: normalizedSuffix, totalVariant: "match" };
  }

  if (/^first-half-total-\d+pt\d+$/.test(normalizedSuffix)) {
    return { ...base, pickCode: normalizedSuffix, totalVariant: "half" };
  }

  if (/^second-half-total-\d+pt\d+$/.test(normalizedSuffix)) {
    return { ...base, pickCode: normalizedSuffix, totalVariant: "half" };
  }

  if (/^team-total-(home|away)-\d+pt\d+$/.test(normalizedSuffix)) {
    return { ...base, pickCode: normalizedSuffix, totalVariant: "team" };
  }

  if (/^first-half-team-total-(home|away)-\d+pt\d+$/.test(normalizedSuffix)) {
    return { ...base, pickCode: normalizedSuffix, totalVariant: "half-team" };
  }

  if (/^second-half-team-total-(home|away)-\d+pt\d+$/.test(normalizedSuffix)) {
    return { ...base, pickCode: normalizedSuffix, totalVariant: "half-team" };
  }

  return undefined;
}

export function mapComboGameToItemProps(
  group: ComboGameGroup,
  options?: {
    selectedMarketId?: string;
    selectedOutcomeSide?: ComboPickOutcomeSide;
    isInCombo?: boolean;
    liveYesPriceByMarketId?: Record<string, number>;
  },
): ComboItemProps {
  const moneylineOdds: ComboOddsOption[] = [];
  const halftimeOdds: ComboOddsOption[] = [];
  const bttsOdds: ComboOddsOption[] = [];
  const spreadOdds: ComboOddsOption[] = [];
  const topScoreOdds: ComboOddsOption[] = [];
  const totalOdds: ComboOddsOption[] = [];

  for (const market of group.markets) {
    const meta = parseComboMarketSlug(market.slug);

    if (meta.marketKind === "unknown") {
      continue;
    }

    if (meta.marketKind === "total" && meta.totalVariant === "match") {
      const matchTotalOptions = buildMatchTotalOddsOptions(
        market,
        meta,
        options?.liveYesPriceByMarketId?.[market.id],
      );

      totalOdds.push(...matchTotalOptions);
      continue;
    }

    const yesOption = buildYesOddsOption(
      market,
      meta,
      group,
      options?.liveYesPriceByMarketId?.[market.id],
    );

    if (!yesOption) {
      continue;
    }

    if (meta.marketKind === "moneyline") {
      moneylineOdds.push(yesOption);
      continue;
    }

    if (meta.marketKind === "halftime") {
      halftimeOdds.push(yesOption);
      continue;
    }

    if (meta.marketKind === "btts") {
      bttsOdds.push(yesOption);
      continue;
    }

    if (meta.marketKind === "spread") {
      spreadOdds.push(yesOption);
      continue;
    }

    if (meta.marketKind === "exact_score") {
      topScoreOdds.push(yesOption);
    }
  }

  const selectedOddsId =
    options?.isInCombo &&
    options.selectedMarketId &&
    options.selectedOutcomeSide
      ? buildComboMarketOddsId(
          options.selectedMarketId,
          options.selectedOutcomeSide,
        )
      : null;

  return {
    kickoffLabel: group.kickoffLabel,
    homeTeam: toComboItemTeamFromGame(group.homeTeam),
    awayTeam: toComboItemTeamFromGame(group.awayTeam),
    moneylineOdds: sortMoneylineOdds(moneylineOdds, group),
    halftimeOdds: sortHalftimeOdds(halftimeOdds, group),
    bttsOdds,
    spreadOdds,
    topScoreOdds,
    totalOdds: sortMatchTotalOdds(totalOdds),
    selectedOddsId,
    defaultExpanded: options?.isInCombo,
  };
}

export function resolveDefaultComboMatchTotalPreviewOdds(
  totalOdds: ComboOddsOption[],
): ComboOddsOption[] {
  if (totalOdds.length <= 2) {
    return totalOdds;
  }

  const byLine = new Map<string, ComboOddsOption[]>();

  for (const option of totalOdds) {
    const lineMatch = option.label.match(/^[OU] (.+)$/);

    if (!lineMatch?.[1]) {
      continue;
    }

    const line = lineMatch[1];
    byLine.set(line, [...(byLine.get(line) ?? []), option]);
  }

  const lines = [...byLine.keys()].sort(
    (left, right) => Number.parseFloat(left) - Number.parseFloat(right),
  );
  const defaultLine = lines.includes("2.5")
    ? "2.5"
    : lines.includes("1.5")
      ? "1.5"
      : lines[0];
  const defaultLineOdds = defaultLine ? byLine.get(defaultLine) : undefined;

  return defaultLineOdds?.slice(0, 2) ?? totalOdds.slice(0, 2);
}

export function mapComboMarketToItemProps(
  market: ComboMarketRecord,
  options?: {
    selectedOutcomeSide?: ComboPickOutcomeSide;
    isInCombo?: boolean;
  },
): ComboItemProps {
  const meta = parseComboMarketSlug(market.slug);
  const homeTeam = toComboItemTeam(meta.homeCode);
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

  if (
    (meta.marketKind === "moneyline" || meta.marketKind === "halftime") &&
    meta.pickCode
  ) {
    if (meta.pickCode === "draw") {
      return {
        teamCode: "DRAW",
        teamName: meta.marketKind === "halftime" ? "HT Draw" : "Draw",
      };
    }

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

  if (meta.marketKind === "btts") {
    return {
      teamCode: "BTTS",
      teamName: market.title,
    };
  }

  if (meta.marketKind === "exact_score" && meta.scoreLabel) {
    return {
      teamCode: meta.scoreLabel,
      teamName: market.title,
    };
  }

  if (meta.marketKind === "spread") {
    return {
      teamCode: "SPR",
      teamName: market.title,
    };
  }

  return {
    teamCode: market.id.slice(0, 6).toUpperCase(),
    teamName: market.title,
  };
}

function buildMatchTotalOddsOptions(
  market: ComboMarketRecord,
  meta: ComboMarketSlugMeta,
  liveYesPrice?: number,
): ComboOddsOption[] {
  const line = meta.totalLine;

  if (!line) {
    return [];
  }

  const catalogYesPrice = Number.parseFloat(market.outcomePrices[0]);
  const catalogNoPrice = Number.parseFloat(market.outcomePrices[1]);
  const yesPrice =
    typeof liveYesPrice === "number" &&
    Number.isFinite(liveYesPrice) &&
    liveYesPrice > 0
      ? liveYesPrice
      : catalogYesPrice;
  const options: ComboOddsOption[] = [];

  if (Number.isFinite(yesPrice)) {
    options.push({
      id: buildComboMarketOddsId(market.id, "yes"),
      label: `O ${line}`,
      price: yesPrice,
    });
  }

  if (Number.isFinite(catalogNoPrice)) {
    options.push({
      id: buildComboMarketOddsId(market.id, "no"),
      label: `U ${line}`,
      price: catalogNoPrice,
    });
  }

  return options;
}

function sortMatchTotalOdds(odds: ComboOddsOption[]): ComboOddsOption[] {
  return [...odds].sort((left, right) => {
    const leftLine = parseMatchTotalLineFromLabel(left.label);
    const rightLine = parseMatchTotalLineFromLabel(right.label);

    if (leftLine !== rightLine) {
      return leftLine - rightLine;
    }

    return left.label.startsWith("O ") ? -1 : 1;
  });
}

function parseMatchTotalLineFromLabel(label: string): number {
  const match = label.match(/^[OU] (.+)$/);

  if (!match?.[1]) {
    return Number.POSITIVE_INFINITY;
  }

  const parsed = Number.parseFloat(match[1]);

  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function buildYesOddsOption(
  market: ComboMarketRecord,
  meta: ComboMarketSlugMeta,
  group: ComboGameGroup,
  liveYesPrice?: number,
): ComboOddsOption | undefined {
  const catalogYesPrice = Number.parseFloat(market.outcomePrices[0]);
  const yesPrice =
    typeof liveYesPrice === "number" && Number.isFinite(liveYesPrice) && liveYesPrice > 0
      ? liveYesPrice
      : catalogYesPrice;

  if (!Number.isFinite(yesPrice)) {
    return undefined;
  }

  const option: ComboOddsOption = {
    id: buildComboMarketOddsId(market.id, "yes"),
    label: formatYesOutcomeLabel(meta, market, group),
    price: yesPrice,
  };

  if (meta.marketKind === "spread") {
    const spreadParts = parseSpreadOutcomeParts(meta, market, group);

    if (spreadParts) {
      option.spreadTeamCode = spreadParts.teamCode;
      option.spreadLine = spreadParts.line;
      option.label = `${spreadParts.teamCode} ${spreadParts.line}`;
    }
  }

  return option;
}

function formatYesOutcomeLabel(
  meta: ComboMarketSlugMeta,
  market: ComboMarketRecord,
  group: ComboGameGroup,
): string {
  if (
    (meta.marketKind === "moneyline" || meta.marketKind === "halftime") &&
    meta.pickCode
  ) {
    if (meta.pickCode === "draw") {
      return meta.marketKind === "halftime" ? "HT Draw" : "Draw";
    }

    if (meta.pickCode === meta.homeCode) {
      return meta.marketKind === "halftime"
        ? `HT ${group.homeTeam.name}`
        : group.homeTeam.name;
    }

    if (meta.pickCode === meta.awayCode) {
      return meta.marketKind === "halftime"
        ? `HT ${group.awayTeam.name}`
        : group.awayTeam.name;
    }

    return getLocalizedTeamName(
      meta.pickCode.toUpperCase(),
      meta.pickCode.toUpperCase(),
    );
  }

  if (meta.marketKind === "btts") {
    if (meta.pickCode === "btts") {
      return "BTTS";
    }

    if (meta.pickCode === "btts-first-half") {
      return "1H BTTS";
    }

    if (meta.pickCode === "btts-second-half") {
      return "2H BTTS";
    }

    return market.title;
  }

  if (meta.marketKind === "total" && meta.totalLine) {
    return formatTotalYesOutcomeLabel(meta, group);
  }

  if (meta.marketKind === "exact_score" && meta.scoreLabel) {
    return meta.scoreLabel;
  }

  if (meta.marketKind === "spread") {
    const spreadParts = parseSpreadOutcomeParts(meta, market, group);

    if (spreadParts) {
      return `${spreadParts.teamCode} ${spreadParts.line}`;
    }

    return market.title;
  }

  return market.outcomes[0] ?? "Yes";
}

function parseSpreadOutcomeParts(
  meta: ComboMarketSlugMeta,
  market: ComboMarketRecord,
  group: ComboGameGroup,
): { teamCode: string; line: string } | undefined {
  const pickCode = meta.pickCode ?? "";
  const slugMatch = pickCode.match(/^spread-([a-z]+)-(\d+)pt(\d+)$/i);

  if (!slugMatch) {
    return undefined;
  }

  const teamCode = resolveSpreadTeamCode(
    slugMatch[1].toLowerCase(),
    meta,
    group,
    market.title,
  );
  const titleMatch = market.title.match(/\s(-?\d+(?:\.\d+)?)\s*$/);

  if (titleMatch) {
    return { teamCode, line: titleMatch[1] };
  }

  const rawLine = `${slugMatch[2]}.${slugMatch[3]}`;
  const line =
    teamCode === group.homeTeam.code ? `-${rawLine}` : `+${rawLine}`;

  return { teamCode, line };
}

function resolveSpreadTeamCode(
  slugTeamKey: string,
  meta: ComboMarketSlugMeta,
  group: ComboGameGroup,
  marketTitle: string,
): string {
  if (slugTeamKey === "home") {
    return group.homeTeam.code;
  }

  if (slugTeamKey === "away") {
    return group.awayTeam.code;
  }

  if (slugTeamKey === meta.homeCode.toLowerCase()) {
    return group.homeTeam.code;
  }

  if (slugTeamKey === meta.awayCode.toLowerCase()) {
    return group.awayTeam.code;
  }

  const titleTeamPart = marketTitle
    .replace(/\s[-+]?\d+(?:\.\d+)?\s*$/, "")
    .trim()
    .toLowerCase();

  if (titleTeamPart) {
    const homeName = group.homeTeam.name.toLowerCase();
    const awayName = group.awayTeam.name.toLowerCase();

    if (titleTeamPart === homeName || homeName.startsWith(titleTeamPart)) {
      return group.homeTeam.code;
    }

    if (titleTeamPart === awayName || awayName.startsWith(titleTeamPart)) {
      return group.awayTeam.code;
    }
  }

  return slugTeamKey.toUpperCase();
}

function formatTotalYesOutcomeLabel(
  meta: ComboMarketSlugMeta,
  group: ComboGameGroup,
): string {
  const line = meta.totalLine ?? "";
  const pickCode = meta.pickCode ?? "";

  if (meta.totalVariant === "match") {
    return `Over ${line}`;
  }

  if (meta.totalVariant === "half") {
    const halfLabel = pickCode.startsWith("first-half") ? "1H" : "2H";

    return `${halfLabel} O ${line}`;
  }

  if (meta.totalVariant === "team" || meta.totalVariant === "half-team") {
    const halfPrefix = pickCode.includes("first-half")
      ? "1H "
      : pickCode.includes("second-half")
        ? "2H "
        : "";
    const teamName = pickCode.includes("-home-")
      ? group.homeTeam.name
      : group.awayTeam.name;

    return `${halfPrefix}${teamName} O ${line}`;
  }

  return `Over ${line}`;
}

function sortHalftimeOdds(
  odds: ComboOddsOption[],
  group: ComboGameGroup,
): ComboOddsOption[] {
  const priority = new Map<string, number>([
    [`HT ${group.homeTeam.name}`, 0],
    ["HT Draw", 1],
    [`HT ${group.awayTeam.name}`, 2],
  ]);

  return [...odds].sort(
    (left, right) =>
      (priority.get(left.label) ?? 99) - (priority.get(right.label) ?? 99),
  );
}

function sortMoneylineOdds(
  odds: ComboOddsOption[],
  group: ComboGameGroup,
): ComboOddsOption[] {
  const priority = new Map<string, number>([
    [group.homeTeam.name, 0],
    ["Draw", 1],
    [group.awayTeam.name, 2],
  ]);

  return [...odds].sort(
    (left, right) =>
      (priority.get(left.label) ?? 99) - (priority.get(right.label) ?? 99),
  );
}

function formatExactScoreLabel(scoreSuffix: string): string {
  if (scoreSuffix === "any-other") {
    return "Any Other";
  }

  const parts = scoreSuffix.split("-");

  if (parts.length === 2 && parts[0] && parts[1]) {
    return `${parts[0]}-${parts[1]}`;
  }

  return scoreSuffix;
}

function toComboItemTeamFromGame(
  team: ComboGameGroup["homeTeam"],
): ComboItemTeam {
  return {
    name: team.name,
    code: team.code,
    logoUrl: team.logoUrl ?? findCuratedTeamByCode(team.code)?.logoUrl,
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

  if (meta.marketKind === "exact_score" && meta.scoreLabel) {
    return `${meta.scoreLabel} ${normalizedOutcome}`;
  }

  return normalizedOutcome;
}

function toComboItemTeam(code: string): ComboItemTeam {
  const teamCode = code.toUpperCase();

  return {
    name: getLocalizedTeamName(teamCode, teamCode),
    code: teamCode,
    logoUrl: findCuratedTeamByCode(teamCode)?.logoUrl,
  };
}
