import type { StrategyCardTeamRef } from "@/views/strategy/components/card";

export type PortfolioStrategyStatus =
  | "not_open"
  | "hit_succeed"
  | "not_finished"
  | "hit_missed";

export type PortfolioStrategyLeg = {
  id: string;
  team: StrategyCardTeamRef;
  marketTitle: string;
  side: "yes" | "no";
  tradedAmount: number;
  toWinAmount: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  tradedAt: string;
};

export type PortfolioStrategyRecord = {
  id: string;
  name: string;
  status: PortfolioStrategyStatus;
  statusLabel: string;
  roiLabel: string;
  value: number;
  hitReturnLabel: string;
  legs: PortfolioStrategyLeg[];
};
