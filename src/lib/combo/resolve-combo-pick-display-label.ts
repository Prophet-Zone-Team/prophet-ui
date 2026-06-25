import { parseExactScoreLabel } from "@/lib/combo/combo-leg-selection";
import { isExactScoreComboPick } from "@/lib/combo/combo-pick-toggle";
import {
  parseComboMarketSlug,
  shouldShowComboPickTeamFlag,
} from "@/lib/combo/map-market-to-combo-item";
import { findCuratedTeamByCode } from "@/data/teams/curated-team-list";
import { getLocalizedTeamName } from "@/lib/i18n/localized-team-name";
import type { ComboPick, ComboPickTeam } from "@/views/combo/combo-widget/types";

function isDrawMoneylinePick(pick: ComboPick): boolean {
  return pick.type === "moneyline" && pick.team.code.toUpperCase() === "DRAW";
}

function isHalftimeMoneylinePick(pick: ComboPick): boolean {
  return pick.type === "moneyline" && /-halftime-result-/i.test(pick.id);
}

export function isMatchTotalComboPick(pick: ComboPick): boolean {
  if (pick.type === "total") {
    return true;
  }

  if (pick.type !== "moneyline") {
    return false;
  }

  const meta = parseComboMarketSlug(pick.id);

  return meta.marketKind === "total" && meta.totalVariant === "match";
}

function toComboPickTeamFromCode(code: string): ComboPickTeam {
  const teamCode = code.toUpperCase();

  return {
    code: teamCode,
    name: getLocalizedTeamName(teamCode, teamCode),
    logoUrl: findCuratedTeamByCode(teamCode)?.logoUrl,
  };
}

function resolveMatchTotalDisplayLabel(pick: ComboPick): string {
  const direction = pick.outcomeSide === "yes" ? "Over" : "Under";
  const line =
    pick.type === "total"
      ? pick.totalValue
      : (parseComboMarketSlug(pick.id).totalLine ?? "");

  return `${direction} ${line} goals`;
}

function resolveExactScoreDisplayLabel(pick: ComboPick): string {
  const meta = parseComboMarketSlug(pick.id);
  const scoreLabel = meta.scoreLabel ?? pick.team.code;

  if (scoreLabel === "Any Other") {
    return scoreLabel;
  }

  const parsed = parseExactScoreLabel(scoreLabel);

  if (!parsed) {
    return pick.selectionLabel;
  }

  if (parsed.home === parsed.away) {
    return `Draw ${scoreLabel}`;
  }

  const winningTeamCode =
    parsed.home > parsed.away
      ? meta.homeCode.toUpperCase()
      : meta.awayCode.toUpperCase();

  return `${winningTeamCode} wins ${scoreLabel}`;
}

function resolveExactScoreDisplayTeam(pick: ComboPick): ComboPickTeam | undefined {
  const meta = parseComboMarketSlug(pick.id);
  const scoreLabel = meta.scoreLabel ?? pick.team.code;
  const parsed = parseExactScoreLabel(scoreLabel);

  if (!parsed || parsed.home === parsed.away) {
    return undefined;
  }

  const teamCode =
    parsed.home > parsed.away
      ? meta.homeCode.toUpperCase()
      : meta.awayCode.toUpperCase();

  return toComboPickTeamFromCode(teamCode);
}

export function resolveComboPickDisplayLabel(pick: ComboPick): string {
  if (pick.type === "spread") {
    return `${pick.team.name} ${pick.spreadValue}`;
  }

  if (isMatchTotalComboPick(pick)) {
    return resolveMatchTotalDisplayLabel(pick);
  }

  if (isExactScoreComboPick(pick)) {
    return resolveExactScoreDisplayLabel(pick);
  }

  if (isHalftimeMoneylinePick(pick)) {
    return `Halftime: ${pick.selectionLabel}`;
  }

  if (isDrawMoneylinePick(pick)) {
    return pick.team.name;
  }

  return pick.selectionLabel;
}

export function resolveComboPickDisplayTeam(
  pick: ComboPick,
): ComboPickTeam | undefined {
  if (isExactScoreComboPick(pick)) {
    return resolveExactScoreDisplayTeam(pick);
  }

  return shouldShowComboPickTeamFlag(pick.team) ? pick.team : undefined;
}
