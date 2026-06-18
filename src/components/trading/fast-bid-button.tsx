"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useState } from "react";

import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { useAuthOptional } from "@/context/auth";
import { trackQuickBidClicked } from "@/lib/analytics/tracking";
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
  const t = useTranslations("trade");
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
  const isBusy = status === "checking" || status === "submitting";
  const busyAriaLabel =
    status === "checking" ? t("checking") : t("submittingOrderStatus");
  const defaultAriaLabel = `Bid ${formatFastBidAmountDisplay(displayAmount)} on ${snapshot.team.name}`;

  async function handleClick() {
    if (
      disabled ||
      status === "checking" ||
      status === "submitting" ||
      regionRestricted
    ) {
      return;
    }

    if (!isAuthenticated) {
      auth?.openLoginModalOnly();
      return;
    }

    trackQuickBidClicked({
      teamId: snapshot.team.id,
      teamName: snapshot.team.name,
      teamCode: snapshot.team.code,
      marketId: snapshot.market.polymarket?.conditionId,
      outcomeId: snapshot.market.polymarket?.tokens?.yes?.tokenId,
      side: "buy",
      price: snapshot.market.probability,
      entrySource: "fast_bid_button"
    });

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
        disabled ||
        status === "checking" ||
        status === "submitting" ||
        regionRestricted
      }
      aria-label={isBusy ? busyAriaLabel : defaultAriaLabel}
      onClick={() => void handleClick()}
    >
      {isBusy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        children
      )}
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
