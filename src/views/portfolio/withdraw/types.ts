import type { FundingAsset } from "@/config/funding";
import type { StableflowWithdrawToken } from "@/lib/funding/stableflow-withdraw";
import type { WithdrawOperationPhase } from "@/types/funding";

export type WithdrawMethod = "bridge" | "stableflow";

export type WithdrawStep = "entry" | "form" | "status";

export type WithdrawSelectableToken = FundingAsset | StableflowWithdrawToken;

export type WithdrawOperationTitleKey =
  | "phaseQuoting"
  | "phaseUnwrapping"
  | "phaseSwapping"
  | "phaseSubmittingDepositTx"
  | "phasePollingStableflow"
  | "phasePollingBridge"
  | "phaseSyncing"
  | "phaseSuccess"
  | "phaseError"
  | "phaseDefault";

export type WithdrawOperationDescriptionKey =
  | "descQuoting"
  | "descUnwrapping"
  | "descSwapping"
  | "descSubmittingDepositTx"
  | "descPollingStableflow"
  | "descPollingBridge"
  | "descSyncing"
  | "pleaseWait";

export function isStableflowWithdrawSelectableToken(
  token: WithdrawSelectableToken | undefined,
): token is StableflowWithdrawToken {
  return Boolean(token && "assetId" in token);
}

export function getWithdrawOperationTitleKey(
  phase: WithdrawOperationPhase,
): WithdrawOperationTitleKey {
  switch (phase) {
    case "quoting":
      return "phaseQuoting";
    case "unwrapping":
      return "phaseUnwrapping";
    case "swapping":
      return "phaseSwapping";
    case "submitting_deposit_tx":
      return "phaseSubmittingDepositTx";
    case "polling_stableflow":
      return "phasePollingStableflow";
    case "polling_bridge":
      return "phasePollingBridge";
    case "syncing":
      return "phaseSyncing";
    case "success":
      return "phaseSuccess";
    case "error":
      return "phaseError";
    default:
      return "phaseDefault";
  }
}

export function getWithdrawOperationDescriptionKey(
  phase: WithdrawOperationPhase,
): WithdrawOperationDescriptionKey {
  switch (phase) {
    case "quoting":
      return "descQuoting";
    case "unwrapping":
      return "descUnwrapping";
    case "swapping":
      return "descSwapping";
    case "submitting_deposit_tx":
      return "descSubmittingDepositTx";
    case "polling_stableflow":
      return "descPollingStableflow";
    case "polling_bridge":
      return "descPollingBridge";
    case "syncing":
      return "descSyncing";
    default:
      return "pleaseWait";
  }
}
