import type { PositionsSummary, PositionsView } from "../../types/funding";
import type { UserPositionRecord } from "../../types/market";

function safeNumber(value: number | undefined): number {
  return Number.isFinite(value) ? (value ?? 0) : 0;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildPositionsSummary(positions: UserPositionRecord[]): PositionsSummary {
  return {
    totalValueUsd: roundMoney(positions.reduce((sum, position) => sum + safeNumber(position.currentValue), 0)),
    totalCashPnlUsd: roundMoney(positions.reduce((sum, position) => sum + safeNumber(position.cashPnl), 0)),
    count: positions.length,
  };
}

export function buildPositionsView(positions: UserPositionRecord[]): PositionsView {
  return {
    items: positions,
    summary: buildPositionsSummary(positions),
    updatedAt: new Date().toISOString(),
  };
}
