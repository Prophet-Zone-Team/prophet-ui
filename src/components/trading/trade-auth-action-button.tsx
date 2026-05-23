"use client";

import type { ReactNode } from "react";

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
  const { isAuthenticated, openLogin, loginInProgress } = useAuth();
  const buttonClass = cn(tradeBidButtonClass, className);

  async function handleConnect() {
    onLoginStart?.();

    try {
      await openLogin();
      await onLoginSuccess?.();
    } catch (error) {
      onLoginError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        className={buttonClass}
        disabled={connectDisabled || loginInProgress}
        onClick={() => void handleConnect()}
      >
        {loginInProgress ? connectingLabel : connectLabel}
      </button>
    );
  }

  const label =
    actionStatus === "signing"
      ? signingLabel
      : actionStatus === "submitting"
        ? submittingLabel
        : actionLabel;

  return (
    <button
      type="button"
      className={buttonClass}
      disabled={!canSubmit}
      onClick={() => void onAction()}
    >
      {label}
    </button>
  );
}
