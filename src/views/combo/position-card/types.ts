import type { ComboPickTeam } from "@/views/combo/combo-widget/types";

export interface PositionPick {
  id: string;
  matchupLabel: string;
  selectionLabel: string;
  marketTitle: string;
  legStatus?: string;
  team: ComboPickTeam;
}

export interface PositionCardProps {
  picks: PositionPick[];
  multiplier: number;
  stakeAmount: number;
  toWinAmount?: number;
  className?: string;
}
