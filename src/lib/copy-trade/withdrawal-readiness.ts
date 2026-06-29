import type { CopyWithdrawalReadiness } from "@/types/copy-trade-funding";

export type CopyWithdrawalBlockReasonCode =
  | "walletNotReady"
  | "cashflowReview"
  | "positionResolve"
  | "redeemSyncing"
  | "positionSettling"
  | "cashflowSyncing"
  | "settlementSyncing"
  | "preflightSyncing"
  | "fundsReserved";

/**
 * Returns a reason code that withdrawal is currently blocked, or null when the
 * user is allowed to submit. Mirrors the copy-trade backend pre-flight gating
 * order.
 */
export function getCopyWithdrawalBlockReasonCode({
  walletReady,
  readiness,
}: {
  walletReady: boolean;
  readiness: CopyWithdrawalReadiness | null;
}): CopyWithdrawalBlockReasonCode | null {
  if (!walletReady) {
    return "walletNotReady";
  }

  if (!readiness) {
    return null;
  }

  if ((readiness.error_cashflow_reconciliations ?? 0) > 0) {
    return "cashflowReview";
  }

  if ((readiness.error_position_outcomes ?? 0) > 0) {
    return "positionResolve";
  }

  if (
    (readiness.pending_redeem_attempts ?? 0) > 0 ||
    (readiness.pending_redeemable_positions ?? 0) > 0
  ) {
    return "redeemSyncing";
  }

  if ((readiness.pending_position_outcomes ?? 0) > 0) {
    return "positionSettling";
  }

  if ((readiness.pending_cashflow_reconciliations ?? 0) > 0) {
    return "cashflowSyncing";
  }

  if ((readiness.pending_settlements ?? 0) > 0) {
    return "settlementSyncing";
  }

  if (readiness.cashflow_ready === false) {
    return "preflightSyncing";
  }

  if ((readiness.reserved_pusd ?? 0) > 0) {
    return "fundsReserved";
  }

  return null;
}
