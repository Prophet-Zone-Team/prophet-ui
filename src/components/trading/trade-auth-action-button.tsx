"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { useAuth } from "@/context/auth";
import { cn } from "@/lib/cn";
import { formatEligibilityRestrictionDetail } from "@/lib/trading/trading-eligibility-client";
import type { BidTradeSide } from "@/types/market";
import { tradeBidButtonClass } from "@/views/trade/trade-widget/trade-ui";

export interface TradeAuthActionButtonProps {
  className?: string;
  tradeSide?: BidTradeSide;
  actionLabel: ReactNode;
  connectLabel?: string;
  connectingLabel?: string;
  signingLabel?: string;
  submittingLabel?: string;
  connectDisabled?: boolean;
  canSubmit?: boolean;
  actionStatus?: "signing" | "submitting";
  onAction: () => void | Promise<void>;
  onLoginStart?: () => void;
  onLoginSuccess?: () => void | Promise<void>;
  onLoginError?: (error: Error) => void;
}

export function TradeAuthActionButton({
  className,
  tradeSide = "buy",
  actionLabel,
  connectLabel = "Connect Wallet",
  connectingLabel = "Connecting…",
  signingLabel = "Waiting for signature…",
  submittingLabel = "Submitting…",
  connectDisabled = false,
  canSubmit = true,
  actionStatus,
  onAction,
  onLoginStart,
  onLoginSuccess,
  onLoginError
}: TradeAuthActionButtonProps) {
  const {
    isAuthenticated,
    isRegionBlocked,
    isBuyRestricted,
    eligibilityView,
    openLogin,
    openLoginModalOnly,
    loginInProgress,
  } = useAuth();
  const buttonClass = cn(tradeBidButtonClass, className);
  const regionRestricted =
    tradeSide === "buy" ? isBuyRestricted : isRegionBlocked;
  const restrictionDetail = formatEligibilityRestrictionDetail(eligibilityView);

  async function handleConnect() {
    onLoginStart?.();

    try {
      if (isRegionBlocked) {
        openLoginModalOnly();
        return;
      }

      await openLogin();
      await onLoginSuccess?.();
    } catch (error) {
      onLoginError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  if (!isAuthenticated) {
    const connectButton = (
      <button
        type="button"
        className={buttonClass}
        disabled={connectDisabled || loginInProgress}
        aria-label={loginInProgress ? connectingLabel : undefined}
        onClick={() => void handleConnect()}
      >
        {loginInProgress ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          connectLabel
        )}
      </button>
    );

    return connectButton;
  }

  const busyLabel =
    actionStatus === "signing"
      ? signingLabel
      : actionStatus === "submitting"
        ? submittingLabel
        : null;
  const label = busyLabel ?? actionLabel;

  const actionButton = (
    <button
      type="button"
      className={buttonClass}
      disabled={!canSubmit || regionRestricted}
      aria-label={busyLabel ?? undefined}
      onClick={() => void onAction()}
    >
      {busyLabel ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        label
      )}
    </button>
  );

  return (
    <RegionRestrictedControl
      restricted={regionRestricted}
      detail={restrictionDetail}
    >
      {actionButton}
    </RegionRestrictedControl>
  );
}
