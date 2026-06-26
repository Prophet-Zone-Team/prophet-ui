import { findCuratedTeamByCode } from "@/data/teams/curated-team-list";
import { isComboGameLive } from "@/lib/combo/combo-game-live-state";
import { getLocalizedTeamName } from "@/lib/i18n/localized-team-name";
import type { ComboGameGroup, ComboMarketRecord } from "@/types/combo";
import type {
  ComboItemProps,
  ComboItemTeam,
  ComboOddsOption,
} from "@/views/combo/combo-item/types";
import type { ComboPickOutcomeSide, ComboPickTeam } from "@/views/combo/combo-widget/types";

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

/** Label shown on combo pick cards; mirrors left-panel odds labels where possible. */
export function resolveComboPickSelectionLabel(
  market: ComboMarketRecord,
  outcomeSide: ComboPickOutcomeSide,
): string {
  const meta = parseComboMarketSlug(market.slug);

  if (
    (meta.marketKind === "moneyline" || meta.marketKind === "halftime") &&
    isComboTeamTogglePickCode(meta)
  ) {
    const teamCode =
      outcomeSide === "yes"
        ? meta.homeCode.toUpperCase()
        : meta.awayCode.toUpperCase();

    return getLocalizedTeamName(teamCode, teamCode);
  }

  if (meta.marketKind === "halftime" && meta.pickCode === "draw") {
    return "Draw";
  }

  if (meta.marketKind === "total" && meta.totalLine) {
    return outcomeSide === "yes"
      ? `O ${meta.totalLine}`
      : `U ${meta.totalLine}`;
  }

  if (meta.marketKind === "spread") {
    const teamCode = resolveSpreadTeamCodeFromMeta(meta);

    if (teamCode) {
      return getLocalizedTeamName(teamCode, teamCode);
    }
  }

  const [yesLabel, noLabel] = market.outcomes;

  return outcomeSide === "yes" ? yesLabel : (noLabel ?? yesLabel);
}

export function shouldShowComboPickTeamFlag(team: { code: string }): boolean {
  const normalized = team.code.toUpperCase();

  return (
    normalized !== "O/U" &&
    normalized !== "BTTS" &&
    normalized !== "DRAW"
  );
}

export function resolveComboPickTeam(
  market: ComboMarketRecord,
  outcomeSide: ComboPickOutcomeSide,
): ComboPickTeam {
  const meta = parseComboMarketSlug(market.slug);

  if (
    (meta.marketKind === "moneyline" || meta.marketKind === "halftime") &&
    isComboTeamTogglePickCode(meta)
  ) {
    const teamCode =
      outcomeSide === "yes"
        ? meta.homeCode.toUpperCase()
        : meta.awayCode.toUpperCase();

    return toComboPickTeam(teamCode);
  }

  if (meta.marketKind === "spread") {
    const teamCode = resolveSpreadTeamCodeFromMeta(meta);

    if (teamCode) {
      return toComboPickTeam(teamCode);
    }
  }

  const fallback = resolveComboMarketTeamCodes(market);

  if (
    fallback.teamCode === "O/U" ||
    fallback.teamCode === "SPR" ||
    fallback.teamCode === "BTTS"
  ) {
    return {
      name: fallback.teamName,
      code: fallback.teamCode,
      logoUrl: market.image,
    };
  }

  return toComboPickTeam(fallback.teamCode);
}

function toComboPickTeam(code: string): ComboPickTeam {
  const teamCode = code.toUpperCase();

  return {
    code: teamCode,
    name: getLocalizedTeamName(teamCode, teamCode),
    logoUrl: findCuratedTeamByCode(teamCode)?.logoUrl,
  };
}

function resolveSpreadTeamCodeFromMeta(
  meta: ComboMarketSlugMeta,
): string | undefined {
  const pickCode = meta.pickCode ?? "";
  const slugMatch = pickCode.match(/^spread-([a-z]+)-/i);

  if (!slugMatch?.[1]) {
    return undefined;
  }

  const key = slugMatch[1].toLowerCase();

  if (key === "home") {
    return meta.homeCode.toUpperCase();
  }

  if (key === "away") {
    return meta.awayCode.toUpperCase();
  }

  if (key === meta.homeCode.toLowerCase()) {
    return meta.homeCode.toUpperCase();
  }

  if (key === meta.awayCode.toLowerCase()) {
    return meta.awayCode.toUpperCase();
  }

  return key.toUpperCase();
}

/** Available spread lines for one team within a game group, sorted numerically. */
export function resolveSpreadOptionsForTeam(
  group: ComboGameGroup,
  teamCode: string,
): string[] {
  const normalizedTeamCode = teamCode.toUpperCase();
  const lines: string[] = [];

  for (const market of group.markets) {
    const meta = parseComboMarketSlug(market.slug);

    if (meta.marketKind !== "spread") {
      continue;
    }

    const parts = parseSpreadOutcomeParts(meta, market, group);

    if (parts?.teamCode === normalizedTeamCode) {
      lines.push(parts.line);
    }
  }

  return sortSpreadLines(lines);
}

export function resolveSpreadMarketForTeamLine(
  group: ComboGameGroup,
  teamCode: string,
  line: string,
): ComboMarketRecord | undefined {
  const normalizedTeamCode = teamCode.toUpperCase();

  for (const market of group.markets) {
    const meta = parseComboMarketSlug(market.slug);

    if (meta.marketKind !== "spread") {
      continue;
    }

    const parts = parseSpreadOutcomeParts(meta, market, group);

    if (parts?.teamCode === normalizedTeamCode && parts.line === line) {
      return market;
    }
  }

  return undefined;
}

export function resolveSpreadLineForMarket(
  market: ComboMarketRecord,
  group: ComboGameGroup,
): string | undefined {
  const meta = parseComboMarketSlug(market.slug);

  if (meta.marketKind !== "spread") {
    return undefined;
  }

  return parseSpreadOutcomeParts(meta, market, group)?.line;
}

function sortSpreadLines(lines: string[]): string[] {
  return [...new Set(lines)].sort((left, right) => {
    const leftValue = Number.parseFloat(left);
    const rightValue = Number.parseFloat(right);

    if (Number.isFinite(leftValue) && Number.isFinite(rightValue)) {
      const leftAbs = Math.abs(leftValue);
      const rightAbs = Math.abs(rightValue);

      if (leftAbs !== rightAbs) {
        return leftAbs - rightAbs;
      }

      return leftValue - rightValue;
    }

    return left.localeCompare(right);
  });
}

function findTeamToggleMarketInGroup(
  group: ComboGameGroup,
  marketKind: "moneyline" | "halftime",
  teamSide: "home" | "away",
): ComboMarketRecord | undefined {
  return group.markets.find((market) => {
    const meta = parseComboMarketSlug(market.slug);

    if (meta.marketKind !== marketKind) {
      return false;
    }

    if (teamSide === "home") {
      return isHomeTeamTogglePickCode(meta);
    }

    return isAwayTeamTogglePickCode(meta);
  });
}

function isComboTeamTogglePickCode(meta: {
  pickCode?: string;
  homeCode: string;
  awayCode: string;
}): boolean {
  return isHomeTeamTogglePickCode(meta) || isAwayTeamTogglePickCode(meta);
}

function isHomeTeamTogglePickCode(meta: {
  pickCode?: string;
  homeCode: string;
}): boolean {
  return meta.pickCode === meta.homeCode || meta.pickCode === "home";
}

function isAwayTeamTogglePickCode(meta: {
  pickCode?: string;
  awayCode: string;
}): boolean {
  return meta.pickCode === meta.awayCode || meta.pickCode === "away";
}

/** Odds option id used to highlight the matching left-panel selection. */
export function buildComboSelectedOddsIdForPick(
  pick: { id: string; type: string; outcomeSide?: ComboPickOutcomeSide },
  market?: ComboMarketRecord,
  group?: ComboGameGroup,
): string | undefined {
  if (pick.type === "spread") {
    return buildComboMarketOddsId(pick.id, "yes");
  }

  if (pick.type !== "moneyline" || !pick.outcomeSide) {
    return undefined;
  }

  if (market && group) {
    const meta = parseComboMarketSlug(market.slug);

    if (
      (meta.marketKind === "moneyline" || meta.marketKind === "halftime") &&
      isComboTeamTogglePickCode(meta)
    ) {
      const targetMarket = findTeamToggleMarketInGroup(
        group,
        meta.marketKind === "halftime" ? "halftime" : "moneyline",
        pick.outcomeSide === "yes" ? "home" : "away",
      );

      if (targetMarket) {
        return buildComboMarketOddsId(targetMarket.id, "yes");
      }
    }
  }

  if (market) {
    const meta = parseComboMarketSlug(market.slug);

    if (meta.marketKind === "exact_score") {
      return buildComboMarketOddsId(pick.id, pick.outcomeSide);
    }

    if (
      (meta.marketKind === "moneyline" || meta.marketKind === "halftime") &&
      isComboTeamTogglePickCode(meta)
    ) {
      return buildComboMarketOddsId(pick.id, "yes");
    }
  }

  return buildComboMarketOddsId(pick.id, pick.outcomeSide);
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
      topScoreOdds.push(
        ...buildExactScoreOddsOptions(
          market,
          meta,
          options?.liveYesPriceByMarketId?.[market.id],
        ),
      );
    }
  }

  const selectedMarket =
    options?.selectedMarketId !== undefined
      ? group.markets.find((market) => market.id === options.selectedMarketId)
      : undefined;
  const selectedOddsId =
    options?.isInCombo &&
    options.selectedMarketId &&
    options.selectedOutcomeSide
      ? buildComboSelectedOddsIdForPick(
          {
            id: options.selectedMarketId,
            type: "moneyline",
            outcomeSide: options.selectedOutcomeSide,
          },
          selectedMarket,
          group,
        ) ?? null
      : null;

  return {
    kickoffAt: group.kickoffAt,
    kickoffLabel: group.kickoffLabel,
    isLive: isComboGameLive(group),
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
        teamName: "Draw",
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

function buildExactScoreOddsOptions(
  market: ComboMarketRecord,
  meta: ComboMarketSlugMeta,
  liveYesPrice?: number,
): ComboOddsOption[] {
  const scoreLabel = meta.scoreLabel;

  if (!scoreLabel) {
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
      label: scoreLabel,
      price: yesPrice,
    });
  }

  if (Number.isFinite(catalogNoPrice)) {
    options.push({
      id: buildComboMarketOddsId(market.id, "no"),
      label: `${scoreLabel} No`,
      price: catalogNoPrice,
    });
  }

  return options;
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
  if (meta.marketKind === "halftime" && meta.pickCode) {
    return formatHalftimeOutcomeLabel(meta, group);
  }

  if (meta.marketKind === "moneyline" && meta.pickCode) {
    if (meta.pickCode === "draw") {
      return "Draw";
    }

    if (meta.pickCode === meta.homeCode) {
      return group.homeTeam.name;
    }

    if (meta.pickCode === meta.awayCode) {
      return group.awayTeam.name;
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

function formatHalftimeOutcomeLabel(
  meta: ComboMarketSlugMeta,
  group: ComboGameGroup,
): string {
  if (meta.pickCode === "draw") {
    return "Draw";
  }

  if (meta.pickCode === meta.homeCode || meta.pickCode === "home") {
    return group.homeTeam.code;
  }

  if (meta.pickCode === meta.awayCode || meta.pickCode === "away") {
    return group.awayTeam.code;
  }

  return meta.pickCode?.toUpperCase() ?? "Yes";
}

function formatHalftimeOutcomeLabelFromSlug(
  meta: ComboMarketSlugMeta,
): string {
  if (meta.pickCode === "draw") {
    return "Draw";
  }

  if (meta.pickCode === meta.homeCode || meta.pickCode === "home") {
    return meta.homeCode.toUpperCase();
  }

  if (meta.pickCode === meta.awayCode || meta.pickCode === "away") {
    return meta.awayCode.toUpperCase();
  }

  return meta.pickCode?.toUpperCase() ?? "Yes";
}

function resolveHalftimeOutcomeSortOrder(meta: ComboMarketSlugMeta): number {
  if (meta.pickCode === meta.homeCode || meta.pickCode === "home") {
    return 0;
  }

  if (meta.pickCode === "draw") {
    return 1;
  }

  if (meta.pickCode === meta.awayCode || meta.pickCode === "away") {
    return 2;
  }

  return 99;
}

function sortHalftimeOdds(
  odds: ComboOddsOption[],
  _group: ComboGameGroup,
): ComboOddsOption[] {
  return [...odds].sort((left, right) => {
    const leftMeta = parseComboMarketSlug(parseComboMarketOddsId(left.id)?.marketId ?? "");
    const rightMeta = parseComboMarketSlug(parseComboMarketOddsId(right.id)?.marketId ?? "");

    return (
      resolveHalftimeOutcomeSortOrder(leftMeta) -
      resolveHalftimeOutcomeSortOrder(rightMeta)
    );
  });
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
