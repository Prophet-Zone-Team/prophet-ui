import type { StrategyCardTeamRef } from "./team-flags-stack";

export type StrategyCardVariant = "available" | "winner" | "loss";

export type StrategyTagBadgeVariant = "high_return" | "low_risk";

export type StrategyCardOutcomeSide = "yes" | "no";

export type StrategyCardLegRow = {
  id?: string;
  team: StrategyCardTeamRef;
  teamName: string;
  marketLabel: string;
  side: StrategyCardOutcomeSide;
  valueLabel: string;
  probabilityLabel: string;
  hitReturnLabel: string;
  /** True when this leg is the resolved tournament winner (ended strategies). */
  isTournamentWinner?: boolean;
};
