"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { useAuthOptional } from "@/context/auth";
import { runFastBid, type FastBidStatus } from "@/lib/trading/run-fast-bid";
import {
  DEFAULT_FAST_BID_AMOUNT,
  formatFastBidAmountDisplay,
  useConfigHydrated,
  useFastBidAmount
} from "@/store";
import type { BidOrderPreview } from "@/lib/market/polymarket-order";
import type { TeamMarketSnapshot, UserOrderPreview } from "@/types/market";
import type { SubmitOrderResult } from "@/views/trade/trade-widget/trade-ticket-helpers";

export interface FastBidButtonProps {
  snapshot: TeamMarketSnapshot;
  className?: string;
  children?: ReactNode;
  showAmount?: boolean;
  amountClassName?: string;
  /** When set, overrides the configured Fast Bid amount from user settings. */
  amount?: number;
  disabled?: boolean;
  /** When false, skips POST /v1/user/transaction after a successful submit. Defaults to true. */
  reportTransaction?: boolean;
  onSuccess?: (input: {
    result: SubmitOrderResult;
    preview: BidOrderPreview;
    userOrderPreview: UserOrderPreview;
  }) => void | Promise<void>;
}

export function FastBidButton({
  snapshot,
  className,
  children,
  showAmount = true,
  amountClassName,
  amount: amountOverride,
  disabled = false,
  reportTransaction = true,
  onSuccess
}: FastBidButtonProps) {
  const router = useRouter();
  const auth = useAuthOptional();
  const fastBidAmount = useFastBidAmount();
  const hasHydrated = useConfigHydrated();
  const [status, setStatus] = useState<FastBidStatus>("idle");
  const isBuyRestricted = auth?.isBuyRestricted ?? false;
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const regionRestricted = isAuthenticated && isBuyRestricted;

  const configuredAmount = hasHydrated ? fastBidAmount : DEFAULT_FAST_BID_AMOUNT;
  const displayAmount = amountOverride ?? configuredAmount;

  const buttonLabel = useMemo(() => {
    if (status === "checking") {
      return "Checking";
    }

    if (status === "submitting") {
      return "Submitting";
    }

    return children;
  }, [children, status]);

  async function handleClick() {
    if (
      disabled ||
      status === "checking" ||
      status === "submitting" ||
      regionRestricted
    ) {
      return;
    }

    await runFastBid({
      snapshot,
      amount: displayAmount,
      auth,
      router,
      onStatusChange: setStatus,
      reportTransaction,
      onSuccess
    });
  }

  const bidButton = (
    <button
      type="button"
      className={className}
      disabled={
        disabled || status === "checking" || status === "submitting" || regionRestricted
      }
      aria-label={`Bid ${formatFastBidAmountDisplay(displayAmount)} on ${snapshot.team.name}`}
      onClick={() => void handleClick()}
    >
      {buttonLabel}
      {showAmount && status === "idle" ? (
        <span className={amountClassName}>
          {formatFastBidAmountDisplay(displayAmount)}
        </span>
      ) : null}
    </button>
  );

  return (
    <RegionRestrictedControl restricted={regionRestricted}>
      {bidButton}
    </RegionRestrictedControl>
  );
}
