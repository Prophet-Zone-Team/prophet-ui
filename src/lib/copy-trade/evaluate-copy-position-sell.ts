import type { CopyPositionPnL } from "@/types/copy-trade-api";

export const DEFAULT_COPY_SELL_MIN_SHARES = 5;
export const CLOB_SELL_SHARE_DECIMALS = 2;
const ROUNDING_EPSILON = 1e-12;

export function canCopyTradePositionSell(position: CopyPositionPnL): boolean {
  const status = (position.settlement_status || "open").toLowerCase();
  return status === "open" && !position.redeemable && position.size > 0;
}

export function resolveCopySellMinShares(minShares?: number): number {
  if (typeof minShares === "number" && minShares > 0) {
    return minShares;
  }

  return DEFAULT_COPY_SELL_MIN_SHARES;
}

export function roundCopySellShares(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function roundDownCopySellShares(
  value: number,
  decimals = CLOB_SELL_SHARE_DECIMALS
): number {
  const factor = 10 ** decimals;
  return Math.floor(value * factor + ROUNDING_EPSILON) / factor;
}

export type CopySellValidationReason =
  | "reconciling"
  | "position_too_small"
  | "below_min"
  | "over_max"
  | "invalid_amount"
  | "will_clear_residual"
  | "will_leave_dust";

export interface CopySellValidationInput {
  maxShares: number;
  selectedShares: number;
  sellAll: boolean;
  minShares: number;
  cashflowPending: number;
}

export interface CopySellValidationResult {
  valid: boolean;
  reason?: CopySellValidationReason;
  submittedShares: number;
  residualShares: number;
  requestedResidual: number;
  willClearResidual: boolean;
  willLeaveUnsellableResidual: boolean;
}

export function validateCopySellAmount(
  input: CopySellValidationInput
): CopySellValidationResult {
  const { maxShares, selectedShares, sellAll, minShares, cashflowPending } =
    input;

  const requestedResidual = Math.max(
    0,
    roundCopySellShares(maxShares - selectedShares)
  );
  const willClearResidual =
    requestedResidual > 0 && requestedResidual < minShares;
  const effectiveSellShares = willClearResidual
    ? maxShares
    : selectedShares;
  const submittedShares = roundDownCopySellShares(effectiveSellShares);
  const residualShares = Math.max(
    0,
    roundCopySellShares(maxShares - submittedShares)
  );
  const willLeaveUnsellableResidual =
    residualShares > 0 && residualShares < minShares;

  const belowMin = !sellAll && selectedShares < minShares;
  const overMax = !sellAll && selectedShares > maxShares + 1e-9;
  const positionTooSmall = maxShares < minShares;
  const reconciling = cashflowPending > 0;
  const invalidAmount = selectedShares <= 0;

  let reason: CopySellValidationReason | undefined;

  if (reconciling) {
    reason = "reconciling";
  } else if (positionTooSmall) {
    reason = "position_too_small";
  } else if (belowMin) {
    reason = "below_min";
  } else if (overMax) {
    reason = "over_max";
  } else if (invalidAmount) {
    reason = "invalid_amount";
  } else if (willClearResidual) {
    reason = "will_clear_residual";
  } else if (willLeaveUnsellableResidual) {
    reason = "will_leave_dust";
  }

  const valid =
    !reconciling &&
    !belowMin &&
    !overMax &&
    !invalidAmount &&
    !positionTooSmall;

  return {
    valid,
    reason,
    submittedShares,
    residualShares,
    requestedResidual,
    willClearResidual,
    willLeaveUnsellableResidual,
  };
}
