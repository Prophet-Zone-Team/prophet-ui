import type { PortfolioComboPositionPick } from "@/lib/portfolio/combo-positions/types";

function formatPickSummaryLine(pick: PortfolioComboPositionPick): string {
  const label = pick.selectionLabel.trim();

  if (!label) {
    return "Outcome to win";
  }

  return `${label} to win`;
}

export function buildComboPicksSummary(
  picks: PortfolioComboPositionPick[]
): string {
  return picks.map(formatPickSummaryLine).join(", ");
}
