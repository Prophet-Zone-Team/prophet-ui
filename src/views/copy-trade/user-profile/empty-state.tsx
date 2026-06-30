"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { useAuth } from "@/context/auth";
import { WalletLoginButton } from "@/layout/header/wallet-login-button";
import { trackLoginClicked } from "@/lib/analytics/tracking";
import { cn } from "@/lib/cn";

import { UserProfileCard } from "./user-profile-card";

const LOGIN_STEP_KEYS = {
  requesting_wallet: "connectingWallet",
  checking_wallet_deployment: "checkingDepositWallet",
  wallet_already_deployed: "depositWalletDeployed",
  deploying_wallet: "deployingWallet",
  awaiting_session_signature: "awaitingSessionSignature",
  creating_session: "creatingSession",
  checking_clob_credentials: "checkingCredentials",
  clob_already_derived: "tradingAlreadyEnabled",
  checking_trading_chain: "checkingNetwork",
  switching_trading_chain: "switchingToPolygon",
  awaiting_clob_signature: "awaitingClobSignature",
  deriving_credentials: "derivingCredentials",
  checking_token_approval: "checkingTokenApproval",
  tokens_already_authorized: "tokensAlreadyAuthorized",
  awaiting_token_approval_signature: "awaitingTokenApprovalSignature",
  submitting_token_approval: "submittingTokenApproval",
  verifying_readiness: "verifyingReadiness",
} as const;

export interface UserProfileEmptyStateProps {
  className?: string;
  variant?: "connect" | "create";
  onAction?: () => void;
}

export function UserProfileEmptyState({
  className,
  variant = "create",
  onAction,
}: UserProfileEmptyStateProps) {
  const t = useTranslations("copyTrade.profile");
  const tWallet = useTranslations("wallet");
  const { hydrated, loginInProgress, loginStep, openLoginModalOnly } =
    useAuth();

  const connectLabel = useMemo(() => {
    if (!hydrated) {
      return t("connectAction");
    }

    if (loginInProgress) {
      if (!loginStep) {
        return tWallet("connecting");
      }

      const key = LOGIN_STEP_KEYS[loginStep as keyof typeof LOGIN_STEP_KEYS];
      return key ? tWallet(key) : tWallet("connecting");
    }

    return t("connectAction");
  }, [hydrated, loginInProgress, loginStep, t, tWallet]);

  function handleConnect() {
    trackLoginClicked({
      entrySource: "copy_trade_profile_empty_state",
      label: t("connectAction"),
    });
    openLoginModalOnly();
  }

  return (
    <UserProfileCard
      className={cn(
        "flex h-[262px] flex-col items-center justify-center gap-4 px-5",
        className
      )}
    >
      <div
        className="size-[46px] shrink-0 rounded-full border border-white bg-[#EBEBEB]"
        aria-hidden="true"
      />

      <p className="text-center text-[16px] leading-5 text-[#909090]">
        {variant === "connect"
          ? t("connectDescription")
          : t("createDescription")}
      </p>

      {variant === "connect" ? (
        <WalletLoginButton
          className="w-full"
          label={connectLabel}
          disabled={!hydrated || loginInProgress}
          onClick={handleConnect}
        />
      ) : (
        <button
          type="button"
          className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-black text-[16px] leading-5 text-white transition-opacity hover:opacity-90"
          onClick={onAction}
        >
          {t("createAction")}
        </button>
      )}
    </UserProfileCard>
  );
}
