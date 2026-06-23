import { parseComboMarketOddsId, parseComboMarketSlug } from "@/lib/combo/map-market-to-combo-item";
import type { ComboGameGroup, ComboMarketRecord } from "@/types/combo";
import type { ComboOddsOption } from "@/views/combo/combo-item/types";

export type MatchTotalSide = "over" | "under";

export interface MatchTotalSelection {
  marketId: string;
  line: number;
  side: MatchTotalSide;
}

export function isMatchTotalMarket(market: ComboMarketRecord): boolean {
  const meta = parseComboMarketSlug(market.slug);

  return meta.marketKind === "total" && meta.totalVariant === "match";
}

export function resolveMatchTotalLineFromMarket(
  market: ComboMarketRecord,
): number | undefined {
  const meta = parseComboMarketSlug(market.slug);
  const line = Number.parseFloat(meta.totalLine ?? "");

  return Number.isFinite(line) ? line : undefined;
}

/** Catalog total line label such as "2.5" for match-total markets. */
export function resolveTotalLineLabelForMarket(
  market: ComboMarketRecord,
): string | undefined {
  if (!isMatchTotalMarket(market)) {
    return undefined;
  }

  const meta = parseComboMarketSlug(market.slug);

  return meta.totalLine;
}

/** Available match-total lines within a game group, sorted numerically. */
export function resolveTotalLineOptionsForGroup(
  group: ComboGameGroup,
): string[] {
  const lines: string[] = [];

  for (const market of group.markets) {
    const line = resolveTotalLineLabelForMarket(market);

    if (line) {
      lines.push(line);
    }
  }

  return sortTotalLines(lines);
}

export function resolveMatchTotalMarketForLine(
  group: ComboGameGroup,
  line: string,
): ComboMarketRecord | undefined {
  return group.markets.find((market) => {
    if (!isMatchTotalMarket(market)) {
      return false;
    }

    return resolveTotalLineLabelForMarket(market) === line;
  });
}

export interface ComboTotalLineOption {
  value: string;
  disabled?: boolean;
}

/** Total line dropdown options for one pick, respecting combo mutex rules. */
export function resolveTotalLineOptionsForPick(
  group: ComboGameGroup,
  pick: { id: string; outcomeSide: string },
  groupPicks: readonly { id: string; outcomeSide?: string }[],
): ComboTotalLineOption[] {
  const side = resolveMatchTotalSideFromOutcomeSide(pick.outcomeSide);
  const otherSelections = resolveMatchTotalSelectionsFromGroupPicks(
    groupPicks.filter((entry) => entry.id !== pick.id),
    group,
  );

  return resolveTotalLineOptionsForGroup(group).map((line) => {
    const market = resolveMatchTotalMarketForLine(group, line);
    const lineValue = market ? resolveMatchTotalLineFromMarket(market) : undefined;

    if (!market || lineValue === undefined) {
      return { value: line, disabled: true };
    }

    const candidate: MatchTotalSelection = {
      marketId: market.id,
      line: lineValue,
      side,
    };

    const compatible = isMatchTotalOptionCompatibleWithSelections(
      candidate,
      otherSelections,
    );

    return compatible
      ? { value: line }
      : { value: line, disabled: true };
  });
}

function sortTotalLines(lines: string[]): string[] {
  return [...new Set(lines)].sort((left, right) => {
    const leftValue = Number.parseFloat(left);
    const rightValue = Number.parseFloat(right);

    if (Number.isFinite(leftValue) && Number.isFinite(rightValue)) {
      return leftValue - rightValue;
    }

    return left.localeCompare(right);
  });
}

export function resolveMatchTotalSideFromOutcomeSide(
  outcomeSide: string,
): MatchTotalSide {
  return outcomeSide === "no" ? "under" : "over";
}

export function resolveMatchTotalSelectionsFromGroupPicks(
  groupPicks: readonly { id: string; outcomeSide?: string }[],
  group: ComboGameGroup,
): MatchTotalSelection[] {
  const selections: MatchTotalSelection[] = [];

  for (const pick of groupPicks) {
    const market = group.markets.find((entry) => entry.id === pick.id);

    if (!market || !isMatchTotalMarket(market)) {
      continue;
    }

    const line = resolveMatchTotalLineFromMarket(market);

    if (line === undefined || !pick.outcomeSide) {
      continue;
    }

    selections.push({
      marketId: pick.id,
      line,
      side: resolveMatchTotalSideFromOutcomeSide(pick.outcomeSide),
    });
  }

  return selections;
}

/** Minimum integer goals for an Over x.5 line to win (e.g. O 3.5 → 4). */
export function resolveMinGoalsForOverLine(line: number): number {
  return Math.floor(line) + 1;
}

/** Maximum integer goals for an Under x.5 line to win (e.g. U 5.5 → 5). */
export function resolveMaxGoalsForUnderLine(line: number): number {
  return Math.floor(line);
}

export function areOverUnderLinesCompatible(
  overLine: number,
  underLine: number,
): boolean {
  return (
    resolveMinGoalsForOverLine(overLine) <= resolveMaxGoalsForUnderLine(underLine)
  );
}

export function areMatchTotalSelectionsCompatible(
  left: MatchTotalSelection,
  right: MatchTotalSelection,
): boolean {
  if (left.marketId === right.marketId) {
    return left.side === right.side;
  }

  if (left.side === "over" && right.side === "over") {
    return false;
  }

  if (left.side === "under" && right.side === "under") {
    return false;
  }

  if (left.side === "over" && right.side === "under") {
    return areOverUnderLinesCompatible(left.line, right.line);
  }

  return areOverUnderLinesCompatible(right.line, left.line);
}

export function isMatchTotalOptionCompatibleWithSelections(
  candidate: MatchTotalSelection,
  existingSelections: readonly MatchTotalSelection[],
): boolean {
  for (const selection of existingSelections) {
    if (
      selection.marketId === candidate.marketId &&
      selection.side === candidate.side
    ) {
      continue;
    }

    if (!areMatchTotalSelectionsCompatible(selection, candidate)) {
      return false;
    }
  }

  return true;
}

export function resolveMatchTotalSelectionFromOption(
  option: ComboOddsOption,
  group: ComboGameGroup,
): MatchTotalSelection | undefined {
  const parsed = parseComboMarketOddsId(option.id);

  if (!parsed) {
    return undefined;
  }

  const market = group.markets.find((entry) => entry.id === parsed.marketId);

  if (!market || !isMatchTotalMarket(market)) {
    return undefined;
  }

  const line = resolveMatchTotalLineFromMarket(market);

  if (line === undefined) {
    return undefined;
  }

  return {
    marketId: parsed.marketId,
    line,
    side: resolveMatchTotalSideFromOutcomeSide(parsed.outcomeSide),
  };
}

export function applyMatchTotalComboRulesToOdds(
  totalOdds: ComboOddsOption[],
  groupPicks: readonly { id: string; outcomeSide?: string }[],
  group: ComboGameGroup,
  disabledTooltip: string,
): ComboOddsOption[] {
  const existingSelections = resolveMatchTotalSelectionsFromGroupPicks(
    groupPicks,
    group,
  );

  if (existingSelections.length === 0) {
    return totalOdds;
  }

  return totalOdds.map((option) => {
    const candidate = resolveMatchTotalSelectionFromOption(option, group);

    if (!candidate) {
      return option;
    }

    if (
      isMatchTotalOptionCompatibleWithSelections(candidate, existingSelections)
    ) {
      return option;
    }

    return {
      ...option,
      disabled: true,
      disabledTooltip,
    };
  });
}

export function removeConflictingMatchTotalPicks<
  T extends { id: string; outcomeSide?: string },
>(
  picks: readonly T[],
  group: ComboGameGroup,
  marketId: string,
  outcomeSide: string,
): T[] {
  const market = group.markets.find((entry) => entry.id === marketId);

  if (!market || !isMatchTotalMarket(market)) {
    return [...picks];
  }

  const line = resolveMatchTotalLineFromMarket(market);

  if (line === undefined) {
    return [...picks];
  }

  const candidate: MatchTotalSelection = {
    marketId,
    line,
    side: resolveMatchTotalSideFromOutcomeSide(outcomeSide),
  };

  const matchTotalIds = new Set(
    group.markets.filter(isMatchTotalMarket).map((entry) => entry.id),
  );

  return picks.filter((pick) => {
    if (!matchTotalIds.has(pick.id)) {
      return true;
    }

    if (pick.id === marketId) {
      return true;
    }

    const existingMarket = group.markets.find((entry) => entry.id === pick.id);

    if (!existingMarket || !pick.outcomeSide) {
      return false;
    }

    const existingLine = resolveMatchTotalLineFromMarket(existingMarket);

    if (existingLine === undefined) {
      return false;
    }

    const existingSelection: MatchTotalSelection = {
      marketId: pick.id,
      line: existingLine,
      side: resolveMatchTotalSideFromOutcomeSide(pick.outcomeSide),
    };

    return areMatchTotalSelectionsCompatible(existingSelection, candidate);
  });
}
