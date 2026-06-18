import {
  parseComboMarketOddsId,
  parseComboMarketSlug,
} from "@/lib/combo/map-market-to-combo-item";
import type { ComboGameGroup } from "@/types/combo";
import type { ComboOddsOption } from "@/views/combo/combo-item/types";
import type { ComboPick } from "@/views/combo/combo-widget/types";

export type ComboMoneylineSide = "home" | "draw" | "away";

export function resolveMoneylineSide(
  pickCode: string,
  homeCode: string,
  awayCode: string,
): ComboMoneylineSide | undefined {
  const normalizedPickCode = pickCode.toLowerCase();

  if (normalizedPickCode === "draw") {
    return "draw";
  }

  if (normalizedPickCode === homeCode.toLowerCase()) {
    return "home";
  }

  if (normalizedPickCode === awayCode.toLowerCase()) {
    return "away";
  }

  return undefined;
}

export function parseExactScoreLabel(
  scoreLabel: string,
): { home: number; away: number } | undefined {
  const match = scoreLabel.match(/^(\d+)\s*-\s*(\d+)$/);

  if (!match) {
    return undefined;
  }

  return {
    home: Number(match[1]),
    away: Number(match[2]),
  };
}

export function exactScoreMatchesMoneylineSide(
  scoreLabel: string,
  side: ComboMoneylineSide,
): boolean {
  if (scoreLabel === "Any Other") {
    return true;
  }

  const parsed = parseExactScoreLabel(scoreLabel);

  if (!parsed) {
    return false;
  }

  if (side === "draw") {
    return parsed.home === parsed.away;
  }

  if (side === "home") {
    return parsed.home > parsed.away;
  }

  return parsed.away > parsed.home;
}

export function resolveSelectedMoneylineSide(
  selectedPick: ComboPick | undefined,
  group: ComboGameGroup,
): ComboMoneylineSide | undefined {
  if (!selectedPick || selectedPick.type !== "moneyline") {
    return undefined;
  }

  const market = group.markets.find((entry) => entry.id === selectedPick.id);

  if (!market) {
    return undefined;
  }

  const meta = parseComboMarketSlug(market.slug);

  if (meta.marketKind !== "moneyline" || !meta.pickCode) {
    return undefined;
  }

  return resolveMoneylineSide(
    meta.pickCode,
    meta.homeCode,
    meta.awayCode,
  );
}

export function filterExactScoreOddsByMoneylineSide(
  odds: ComboOddsOption[],
  side: ComboMoneylineSide,
): ComboOddsOption[] {
  return odds.filter((option) => exactScoreMatchesMoneylineSide(option.label, side));
}

export function applyComboLegSelectionRules(input: {
  moneylineOdds: ComboOddsOption[];
  spreadOdds: ComboOddsOption[];
  topScoreOdds: ComboOddsOption[];
  selectedPick?: ComboPick;
  group: ComboGameGroup;
  disabledTooltip: string;
}): {
  moneylineOdds: ComboOddsOption[];
  spreadOdds: ComboOddsOption[];
  topScoreOdds: ComboOddsOption[];
} {
  const moneylineSide = resolveSelectedMoneylineSide(input.selectedPick, input.group);
  const spreadsDisabled = Boolean(moneylineSide);

  const spreadOdds = input.spreadOdds.map((option) =>
    spreadsDisabled
      ? {
          ...option,
          disabled: true,
          disabledTooltip: input.disabledTooltip,
        }
      : option,
  );

  const topScoreOdds = moneylineSide
    ? filterExactScoreOddsByMoneylineSide(input.topScoreOdds, moneylineSide)
    : input.topScoreOdds;

  return {
    moneylineOdds: input.moneylineOdds,
    spreadOdds,
    topScoreOdds,
  };
}

export function resolveComboOddsMarketId(option: ComboOddsOption): string | undefined {
  return parseComboMarketOddsId(option.id)?.marketId;
}
