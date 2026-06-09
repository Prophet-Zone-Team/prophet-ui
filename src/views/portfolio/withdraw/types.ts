import type { FundingAsset } from "@/config/funding";
import type { StableflowWithdrawToken } from "@/lib/funding/stableflow-withdraw";
import type { WithdrawOperationPhase } from "@/types/funding";

export type WithdrawMethod = "bridge" | "stableflow";

export type WithdrawStep = "entry" | "form" | "status";

export type WithdrawSelectableToken = FundingAsset | StableflowWithdrawToken;

export function isStableflowWithdrawSelectableToken(
  token: WithdrawSelectableToken | undefined,
): token is StableflowWithdrawToken {
  return Boolean(token && "assetId" in token);
}

export function formatWithdrawOperationTitle(phase: WithdrawOperationPhase): string {
  switch (phase) {
    case "quoting":
      return "Preparing withdrawal";
    case "unwrapping":
      return "Unwrapping pUSD";
    case "swapping":
      return "Converting to USDC";
    case "submitting_deposit_tx":
      return "Registering deposit";
    case "polling_stableflow":
      return "Cross-chain transfer";
    case "polling_bridge":
      return "Bridge withdrawal";
    case "syncing":
      return "Updating balance";
    case "success":
      return "Withdrawal complete";
    case "error":
      return "Withdrawal could not be completed";
    default:
      return "Withdraw";
  }
}
