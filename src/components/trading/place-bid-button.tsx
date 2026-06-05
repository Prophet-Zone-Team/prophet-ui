"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { useAuthOptional } from "@/context/auth";
import { teamTradeHref } from "@/lib/routes/trade";
import { runFastBid, type FastBidStatus } from "@/lib/trading/run-fast-bid";
import {
  DEFAULT_FAST_BID_AMOUNT,
  formatFastBidAmountDisplay,
  useConfigHydrated,
  useFastBidAmount
} from "@/store";
import type { TeamMarketSnapshot } from "@/types/market";

interface PlaceBidButtonProps {
  children?: ReactNode;
  className?: string;
  snapshot?: TeamMarketSnapshot;
  teamName?: string;
  /** When set with a snapshot, navigates to the trade page instead of submitting inline. */
  navigateToTrade?: boolean;
}

export function PlaceBidButton({
  children = "Quick Bid",
  className = "inline-flex h-9 min-w-[86px] items-center justify-center rounded-[7px] bg-gradient-to-br from-[#0d69ff] to-[#124cf0] text-xs font-extrabold text-white shadow-[0_10px_22px_rgba(18,82,246,0.22)] disabled:cursor-wait disabled:opacity-70",
  snapshot,
  navigateToTrade = false
}: PlaceBidButtonProps) {
  const router = useRouter();
  const auth = useAuthOptional();
  const fastBidAmount = useFastBidAmount();
  const hasHydrated = useConfigHydrated();
  const [status, setStatus] = useState<FastBidStatus>("idle");
  const shouldShowAmount = isQuickBidLabel(children);
  const displayAmount = hasHydrated ? fastBidAmount : DEFAULT_FAST_BID_AMOUNT;
  const isBuyRestricted = auth?.isBuyRestricted ?? false;
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const regionRestricted = isAuthenticated && isBuyRestricted;

  const buttonText = useMemo(() => {
    if (status === "checking") {
      return "Checking";
    }

    if (status === "submitting") {
      return "Submitting";
    }

    return shouldShowAmount
      ? `Quick Bid(${formatFastBidAmountDisplay(displayAmount).slice(1)})`
      : children;
  }, [children, displayAmount, shouldShowAmount, status]);

  async function handleClick() {
    if (!snapshot) {
      window.location.assign("/fifa");
      return;
    }

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

  if (navigateToTrade && snapshot) {
    return (
      <Link
        href={`${teamTradeHref(snapshot.team.id)}#trade`}
        className={className}
        aria-label={
          typeof children === "string"
            ? `${children} for ${snapshot.team.name}`
            : `Open trade for ${snapshot.team.name}`
        }
      >
        {children}
      </Link>
    );
  }

  const bidButton = (
    <button
      type="button"
      className={className}
      disabled={status === "checking" || status === "submitting" || regionRestricted}
      onClick={() => void handleClick()}
    >
      {buttonText}
    </button>
  );

  return (
    <RegionRestrictedControl restricted={regionRestricted}>
      {bidButton}
    </RegionRestrictedControl>
  );
}

function isQuickBidLabel(children: ReactNode) {
  return typeof children === "string" && children.trim().toLowerCase() === "quick bid";
}
