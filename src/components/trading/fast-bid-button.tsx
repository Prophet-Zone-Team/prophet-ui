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
import type { TeamMarketSnapshot } from "@/types/market";

export interface FastBidButtonProps {
  snapshot: TeamMarketSnapshot;
  className?: string;
  children?: ReactNode;
  showAmount?: boolean;
  amountClassName?: string;
}

export function FastBidButton({
  snapshot,
  className,
  children,
  showAmount = true,
  amountClassName
}: FastBidButtonProps) {
  const router = useRouter();
  const auth = useAuthOptional();
  const fastBidAmount = useFastBidAmount();
  const hasHydrated = useConfigHydrated();
  const [status, setStatus] = useState<FastBidStatus>("idle");
  const isRegionBlocked = auth?.isRegionBlocked ?? false;
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const regionRestricted = isAuthenticated && isRegionBlocked;

  const displayAmount = hasHydrated ? fastBidAmount : DEFAULT_FAST_BID_AMOUNT;

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
    if (status === "checking" || status === "submitting" || regionRestricted) {
      return;
    }

    await runFastBid({
      snapshot,
      amount: displayAmount,
      auth,
      router,
      onStatusChange: setStatus
    });
  }

  const bidButton = (
    <button
      type="button"
      className={className}
      disabled={status === "checking" || status === "submitting" || regionRestricted}
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
