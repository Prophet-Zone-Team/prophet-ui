"use client";

import type { ReactNode } from "react";

import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { useAuth } from "@/context/auth";
import { cn } from "@/lib/cn";
import { tradeBidButtonClass } from "@/views/trade/trade-widget/trade-ui";

export interface TradeAuthActionButtonProps {
  className?: string;
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
    openLogin,
    openLoginModalOnly,
    loginInProgress,
  } = useAuth();
  const buttonClass = cn(tradeBidButtonClass, className);

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
        onClick={() => void handleConnect()}
      >
        {loginInProgress ? connectingLabel : connectLabel}
      </button>
    );

    return connectButton;
  }

  const label =
    actionStatus === "signing"
      ? signingLabel
      : actionStatus === "submitting"
        ? submittingLabel
        : actionLabel;

  const actionButton = (
    <button
      type="button"
      className={buttonClass}
      disabled={!canSubmit || isRegionBlocked}
      onClick={() => void onAction()}
    >
      {label}
    </button>
  );

  return (
    <RegionRestrictedControl restricted={isRegionBlocked}>
      {actionButton}
    </RegionRestrictedControl>
  );
}
