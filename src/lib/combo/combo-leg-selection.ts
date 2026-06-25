import {
  parseComboMarketOddsId,
  parseComboMarketSlug,
} from "@/lib/combo/map-market-to-combo-item";
import { applyMatchTotalComboRulesToOdds } from "@/lib/combo/match-total-combo-rules";
import {
  resolveSelectedMarketIdByKind,
} from "@/lib/combo/combo-market-mutex";
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

export function resolveSelectedMoneylineSideFromGroupPicks(
  groupPicks: readonly ComboPick[],
  group: ComboGameGroup,
): ComboMoneylineSide | undefined {
  for (const pick of groupPicks) {
    const side = resolveSelectedMoneylineSide(pick, group);

    if (side) {
      return side;
    }
  }

  return undefined;
}

function disableOtherOptionsInGroup(
  odds: ComboOddsOption[],
  selectedMarketId: string | undefined,
  disabledTooltip: string,
): ComboOddsOption[] {
  if (!selectedMarketId) {
    return odds;
  }

  return odds.map((option) => {
    const marketId = resolveComboOddsMarketId(option);

    if (marketId && marketId !== selectedMarketId) {
      return {
        ...option,
        disabled: true,
        disabledTooltip,
      };
    }

    return option;
  });
}

function disableAllOptions(
  odds: ComboOddsOption[],
  disabledTooltip: string,
): ComboOddsOption[] {
  return odds.map((option) => ({
    ...option,
    disabled: true,
    disabledTooltip,
  }));
}
function resolveExactScoreLabelFromOption(
  option: ComboOddsOption,
): string | undefined {
  const parsed = parseComboMarketOddsId(option.id);

  if (!parsed) {
    return undefined;
  }

  if (parsed.outcomeSide === "yes") {
    return option.label;
  }

  if (option.label.endsWith(" No")) {
    return option.label.slice(0, -3);
  }

  return option.label;
}

export function filterExactScoreOddsByMoneylineSide(
  odds: ComboOddsOption[],
  side: ComboMoneylineSide,
): ComboOddsOption[] {
  return odds.filter((option) => {
    const scoreLabel = resolveExactScoreLabelFromOption(option);

    return scoreLabel
      ? exactScoreMatchesMoneylineSide(scoreLabel, side)
      : false;
  });
}

export function applyMoneylineExactScoreSideRulesToOdds(
  odds: ComboOddsOption[],
  moneylineSide: ComboMoneylineSide | undefined,
  disabledTooltip: string,
): ComboOddsOption[] {
  if (!moneylineSide) {
    return odds;
  }

  return odds.map((option) => {
    const parsed = parseComboMarketOddsId(option.id);

    if (!parsed || parsed.outcomeSide !== "yes") {
      return option;
    }

    const scoreLabel = resolveExactScoreLabelFromOption(option);

    if (!scoreLabel || scoreLabel === "Any Other") {
      return option;
    }

    if (!exactScoreMatchesMoneylineSide(scoreLabel, moneylineSide)) {
      return option;
    }

    return {
      ...option,
      disabled: true,
      disabledTooltip,
    };
  });
}

export function applyComboLegSelectionRules(input: {
  moneylineOdds: ComboOddsOption[];
  halftimeOdds: ComboOddsOption[];
  spreadOdds: ComboOddsOption[];
  topScoreOdds: ComboOddsOption[];
  totalOdds: ComboOddsOption[];
  groupPicks: readonly ComboPick[];
  group: ComboGameGroup;
  disabledTooltip: string;
}): {
  moneylineOdds: ComboOddsOption[];
  halftimeOdds: ComboOddsOption[];
  spreadOdds: ComboOddsOption[];
  topScoreOdds: ComboOddsOption[];
  totalOdds: ComboOddsOption[];
} {
  const moneylineSide = resolveSelectedMoneylineSideFromGroupPicks(
    input.groupPicks,
    input.group,
  );
  const selectedMoneylineMarketId = resolveSelectedMarketIdByKind(
    input.groupPicks,
    input.group,
    "moneyline",
  );
  const selectedSpreadMarketId = resolveSelectedMarketIdByKind(
    input.groupPicks,
    input.group,
    "spread",
  );
  const selectedExactScoreMarketId = resolveSelectedMarketIdByKind(
    input.groupPicks,
    input.group,
    "exact_score",
  );
  const selectedHalftimeMarketId = resolveSelectedMarketIdByKind(
    input.groupPicks,
    input.group,
    "halftime",
  );
  const hasMoneylineSelected = Boolean(selectedMoneylineMarketId);
  const hasSpreadSelected = Boolean(selectedSpreadMarketId);

  const moneylineOdds = hasSpreadSelected
    ? disableAllOptions(input.moneylineOdds, input.disabledTooltip)
    : disableOtherOptionsInGroup(
        input.moneylineOdds,
        selectedMoneylineMarketId,
        input.disabledTooltip,
      );

  const spreadOdds = hasMoneylineSelected
    ? disableAllOptions(input.spreadOdds, input.disabledTooltip)
    : disableOtherOptionsInGroup(
        input.spreadOdds,
        selectedSpreadMarketId,
        input.disabledTooltip,
      );

  const halftimeOdds = disableOtherOptionsInGroup(
    input.halftimeOdds,
    selectedHalftimeMarketId,
    input.disabledTooltip,
  );

  const filteredTopScoreOdds = moneylineSide
    ? filterExactScoreOddsByMoneylineSide(input.topScoreOdds, moneylineSide)
    : input.topScoreOdds;
  const topScoreOddsWithMoneylineSideRules =
    applyMoneylineExactScoreSideRulesToOdds(
      filteredTopScoreOdds,
      moneylineSide,
      input.disabledTooltip,
    );
  const topScoreOdds = disableOtherOptionsInGroup(
    topScoreOddsWithMoneylineSideRules,
    selectedExactScoreMarketId,
    input.disabledTooltip,
  );

  const totalOdds = applyMatchTotalComboRulesToOdds(
    input.totalOdds,
    input.groupPicks,
    input.group,
    input.disabledTooltip,
  );

  return {
    moneylineOdds,
    halftimeOdds,
    spreadOdds,
    topScoreOdds,
    totalOdds,
  };
}

export function resolveComboOddsMarketId(option: ComboOddsOption): string | undefined {
  return parseComboMarketOddsId(option.id)?.marketId;
}

export { isMatchTotalMarket } from "@/lib/combo/match-total-combo-rules";
