import type { ComboPick } from "@/views/combo/combo-widget/types";

export function isExactScoreComboPick(pick: ComboPick): boolean {
  return pick.type === "moneyline" && /-exact-score-/i.test(pick.id);
}

export function isComboPickOutcomeToggleLocked(pick: ComboPick): boolean {
  return isExactScoreComboPick(pick);
}
