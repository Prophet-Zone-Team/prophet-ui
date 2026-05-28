"use client";

import { Loader2 } from "lucide-react";

import type { WithdrawOperationPhase } from "@/types/funding";
import { formatWithdrawOperationTitle } from "@/views/portfolio/withdraw/types";

export interface WithdrawStatusStepProps {
  phase: WithdrawOperationPhase;
  detail?: string;
  error?: string;
}

export function WithdrawStatusStep({ phase, detail, error }: WithdrawStatusStepProps) {
  const title = formatWithdrawOperationTitle(phase);
  const isError = phase === "error";
  const isSuccess = phase === "success";
  const loading = !isError && !isSuccess && phase !== "idle";

  const description = isError
    ? error ?? "An unexpected error occurred."
    : isSuccess
      ? "Your withdrawal was submitted successfully."
      : detail ?? defaultDescription(phase);

  return (
    <div className="flex flex-col items-center gap-4 pb-10 md:pb-2 pt-16 text-center">
      {loading ? <Loader2 className="h-8 w-8 animate-spin text-[#909090]" aria-hidden="true" /> : null}
      <p className={`m-0 text-xl font-[556] ${isError ? "text-prophet-red" : "text-black"}`}>{title}</p>
      <p className="m-0 max-w-sm text-sm text-[#909090]">{description}</p>
    </div>
  );
}

function defaultDescription(phase: WithdrawOperationPhase): string {
  switch (phase) {
    case "quoting":
      return "Fetching route and deposit details.";
    case "unwrapping":
      return "Sign the wallet prompt to unwrap pUSD on your deposit wallet.";
    case "swapping":
      return "Sign the wallet prompt to swap USDC.e and send USDC to the destination.";
    case "submitting_deposit_tx":
      return "Linking your on-chain transfer to Stableflow.";
    case "polling_stableflow":
      return "Stableflow is routing funds to your recipient chain.";
    case "polling_bridge":
      return "Polymarket Bridge is processing your withdrawal.";
    case "syncing":
      return "Refreshing your tradable balance.";
    default:
      return "Please wait…";
  }
}
