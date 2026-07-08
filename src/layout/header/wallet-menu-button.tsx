"use client";

import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/context/auth";
import { trackLoginClicked } from "@/lib/analytics/tracking";
import { WalletConnectedBar } from "@/layout/header/wallet-connected-bar";
import { WalletLoginButton } from "@/layout/header/wallet-login-button";
import { WalletMenuDropdown } from "@/layout/header/wallet-menu-dropdown";
import { FastBidSettingDialog } from "@/layout/header/fast-bid-setting-dialog";
import { useDepositDialogStore } from "@/store/use-deposit-dialog";
import { DepositDialog } from "@/views/portfolio/deposit";
import { MigrateDialog } from "@/views/portfolio/migrate";
import { PrivateTopupOnboarding } from "@/views/portfolio/private-topup/private-topup-onboarding";
import { formatNumber } from "@/utils";
import { WalletDarkModeMenuItem } from "./wallet-dark-mode-menu-item";
import { WalletLanguageMenuItem } from "./wallet-language-menu-item";
import { WalletOutcomeDisplayMenuItem } from "./wallet-outcome-display-menu-item";
import { useTranslations } from "next-intl";

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

interface WalletMenuButtonProps {
  isPrivateMode?: boolean;
  hideWalletFundingControls?: boolean;
  isMobileDrawerOpen: boolean;
  onMobileDrawerClose: () => void;
}

export function WalletMenuButton(props: WalletMenuButtonProps) {
  const {
    isPrivateMode,
    hideWalletFundingControls,
    isMobileDrawerOpen,
    onMobileDrawerClose
  } = props;

  const menuRef = useRef<HTMLDivElement>(null);
  const {
    session,
    hydrated,
    isAuthenticated,
    isBuyRestricted,
    loginInProgress,
    loginStep,
    error,
    cash,
    cashStatus,
    openLoginModalOnly,
    disconnect,
  } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hasPendingDeposit, setHasPendingDeposit] = useState(false);
  const [fastBidOpen, setFastBidOpen] = useState(false);
  const t = useTranslations("wallet");
  const depositDialogOpen = useDepositDialogStore((state) => state.isOpen);
  const openDepositDialog = useDepositDialogStore((state) => state.open);
  const closeDepositDialog = useDepositDialogStore((state) => state.close);
  const consumeDepositOnSuccess = useDepositDialogStore(
    (state) => state.consumeOnSuccess,
  );
  const [privateTopupIntroOpen, setPrivateTopupIntroOpen] = useState(false);
  const [privateTopupGuideOpen, setPrivateTopupGuideOpen] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) {
        return;
      }

      if (
        target instanceof Element &&
        target.closest("[data-polymarket-address-copy-dialog]")
      ) {
        return;
      }

      setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  const loginLabel = useMemo(() => {
    if (!hydrated) {
      return t("login");
    }

    if (loginInProgress) {
      if (!loginStep) {
        return t("connecting");
      }

      const key = LOGIN_STEP_KEYS[loginStep as keyof typeof LOGIN_STEP_KEYS];
      return key ? t(key) : t("connecting");
    }

    return t("login");
  }, [hydrated, loginInProgress, loginStep, t]);

  const balanceDisplay = useMemo(() => {
    if (cashStatus === "loading") {
      return "-";
    }

    return formatNumber(cash?.available, 2, true, {
      round: 0,
      isZeroPrecision: true,
    });
  }, [cash?.available, cashStatus]);

  const handleDepositSuccess = useCallback(async () => {
    const onSuccess = consumeDepositOnSuccess();

    if (onSuccess) {
      await onSuccess();
    }
  }, [consumeDepositOnSuccess]);

  function handleLogin() {
    setMessage(undefined);
    trackLoginClicked({
      entrySource: "header_wallet_menu",
      label: "Login"
    });
    openLoginModalOnly();
  }

  async function logout() {
    setMessage(undefined);

    try {
      await disconnect();
      setIsOpen(false);
    } catch (logoutError) {
      setMessage(logoutError instanceof Error ? logoutError.message : String(logoutError));
    }
  }

  if (!hydrated || !isAuthenticated || !session) {
    if (isPrivateMode) {
      return null;
    }
    return (
      <div ref={menuRef} className="relative inline-flex flex-col items-end">
        <div className="flex items-center gap-2">
          <WalletDarkModeMenuItem variant="compact" />
          <WalletOutcomeDisplayMenuItem variant="compact" />
          <WalletLanguageMenuItem variant="compact" />
          <WalletLoginButton
            label={loginLabel}
            disabled={!hydrated || loginInProgress}
            onClick={handleLogin}
          />
        </div>
        {(message ?? error) ? (
          <p className="mt-2 w-[220px] text-right text-xs text-prophet-red absolute right-2 -bottom-2 translate-y-[100%]">
            {message ?? error}
          </p>
        ) : null}
      </div>
    );
  }

  const polymarketAddress = session.funderAddress ?? session.walletAddress;

  const handlePrivateBalanceClick = async () => {
    setPrivateTopupIntroOpen(true);
  };

  return (
    <div ref={menuRef} className="relative inline-flex flex-col items-end">
      <WalletConnectedBar
        polymarketAddress={polymarketAddress}
        balanceDisplay={balanceDisplay}
        isMenuOpen={isOpen}
        regionRestricted={isBuyRestricted}
        showDepositPendingIndicator={hasPendingDeposit}
        onDeposit={() => openDepositDialog()}
        onPrivateTopup={() => setPrivateTopupIntroOpen(true)}
        onPrivateBalanceClick={() => handlePrivateBalanceClick()}
        onToggleMenu={() => setIsOpen((value) => !value)}
        isPrivateMode={isPrivateMode}
        hideWalletFundingControls={hideWalletFundingControls}
      />

      <AnimatePresence>
        {isOpen ? (
          <WalletMenuDropdown
            key="wallet-menu-dropdown"
            polymarketAddress={polymarketAddress}
            onClose={() => setIsOpen(false)}
            onLogout={logout}
            onOpenFastBid={() => setFastBidOpen(true)}
            isPrivateMode={isPrivateMode}
          />
        ) : null}
      </AnimatePresence>

      <DepositDialog
        open={depositDialogOpen}
        onClose={closeDepositDialog}
        onDepositSuccess={handleDepositSuccess}
        onPendingDepositChange={setHasPendingDeposit}
        onOpenPrivateTopup={() => {
          closeDepositDialog();
          setPrivateTopupIntroOpen(true);
        }}
      />

      <MigrateDialog />

      <FastBidSettingDialog
        open={fastBidOpen}
        onClose={() => setFastBidOpen(false)}
      />

      <PrivateTopupOnboarding
        introOpen={privateTopupIntroOpen}
        guideOpen={privateTopupGuideOpen}
        walletAddress={session.walletAddress}
        onIntroOpenChange={setPrivateTopupIntroOpen}
        onGuideOpenChange={setPrivateTopupGuideOpen}
      />

      {message ? (
        <p className="mt-2 max-w-[220px] text-right text-xs text-prophet-red">
          {message}
        </p>
      ) : null}
    </div>
  );
}
