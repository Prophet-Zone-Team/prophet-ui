import type { ComboPick } from "@/views/combo/combo-widget/types";

export function formatComboMobilePickSummary(picks: ComboPick[]): string {
  return picks
    .map((pick) => {
      if (pick.type === "spread") {
        return `${pick.team.name} ${pick.spreadValue}`;
      }

      if (pick.type === "total") {
        return pick.selectionLabel;
      }

      return pick.team.name;
    })
    .join(", ");
}
