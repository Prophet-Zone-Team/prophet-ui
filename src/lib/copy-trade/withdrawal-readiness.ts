import type { CopyWithdrawalReadiness } from "@/types/copy-trade-funding";

/**
 * Returns a human-readable reason that withdrawal is currently blocked, or an
 * empty string when the user is allowed to submit. Mirrors the copy-trade
 * backend pre-flight gating order.
 */
export function getCopyWithdrawalBlockReason({
  walletReady,
  readiness,
}: {
  walletReady: boolean;
  readiness: CopyWithdrawalReadiness | null;
}): string {
  if (!walletReady) {
    return "Copy wallet is not ready for withdrawal yet.";
  }

  if (!readiness) {
    return "";
  }

  if ((readiness.error_cashflow_reconciliations ?? 0) > 0) {
    return "Some orders need manual review before withdrawal.";
  }

  if ((readiness.error_position_outcomes ?? 0) > 0) {
    return "Some positions need to be resolved before withdrawal.";
  }

  if (
    (readiness.pending_redeem_attempts ?? 0) > 0 ||
    (readiness.pending_redeemable_positions ?? 0) > 0
  ) {
    return "Resolved positions are still being claimed or synced.";
  }

  if ((readiness.pending_position_outcomes ?? 0) > 0) {
    return "Resolved positions are still being settled.";
  }

  if ((readiness.pending_cashflow_reconciliations ?? 0) > 0) {
    return "Orders are waiting for on-chain settlement sync.";
  }

  if ((readiness.pending_settlements ?? 0) > 0) {
    return "Orders are waiting for on-chain settlement sync.";
  }

  if (readiness.cashflow_ready === false) {
    return "A withdrawal pre-flight sync is still in progress.";
  }

  if ((readiness.reserved_pusd ?? 0) > 0) {
    return "Funds are reserved by open orders.";
  }

  return "";
}
