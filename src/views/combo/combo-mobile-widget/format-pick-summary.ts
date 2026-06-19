import type { ComboPick } from "@/views/combo/combo-widget/types";

export function formatComboMobilePickSummary(picks: ComboPick[]): string {
  return picks
    .map((pick) => {
      if (pick.type === "spread") {
        return `${pick.team.name} ${pick.spreadValue}`;
      }

      return pick.team.name;
    })
    .join(", ");
}
