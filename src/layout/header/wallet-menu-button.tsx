"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/context/auth";
import { WalletConnectedBar } from "@/layout/header/wallet-connected-bar";
import { WalletLoginButton } from "@/layout/header/wallet-login-button";
import { WalletMenuDropdown } from "@/layout/header/wallet-menu-dropdown";
import { FastBidSettingDialog } from "@/layout/header/fast-bid-setting-dialog";
import { DepositDialog } from "@/views/portfolio/deposit";
import { PrivateTopupOnboarding } from "@/views/portfolio/private-topup/private-topup-onboarding";
import { formatNumber } from "@/utils";
import MobileDrawer from "./mobile-drawer";

const LOGIN_STEP_LABELS = {
  requesting_wallet: "Connecting wallet…",
  checking_wallet_deployment: "Checking deposit wallet…",
  wallet_already_deployed: "Deposit wallet already deployed",
  deploying_wallet: "Deploying wallet…",
  awaiting_session_signature: "Awaiting session signature…",
  creating_session: "Creating session…",
  checking_clob_credentials: "Checking credentials…",
  clob_already_derived: "Trading already enabled",
  checking_trading_chain: "Checking network…",
  switching_trading_chain: "Switching to Polygon…",
  awaiting_clob_signature: "Awaiting CLOB signature…",
  deriving_credentials: "Deriving credentials…",
  checking_token_approval: "Checking token approval…",
  tokens_already_authorized: "Tokens already authorized",
  awaiting_token_approval_signature: "Awaiting token approval signature…",
  submitting_token_approval: "Submitting token approval…",
  verifying_readiness: "Verifying readiness…",
} as const;

interface WalletMenuButtonProps {
  isPrivateMode?: boolean;
  isMobileDrawerOpen: boolean;
  onMobileDrawerClose: () => void;
}

export function WalletMenuButton(props: WalletMenuButtonProps) {
  const { isPrivateMode, isMobileDrawerOpen, onMobileDrawerClose } = props;

  const menuRef = useRef<HTMLDivElement>(null);
  const {
    session,
    hydrated,
    isAuthenticated,
    isRegionBlocked,
    loginInProgress,
    loginStep,
    error,
    cash,
    cashStatus,
    openLoginModalOnly,
    disconnect,
  } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [fastBidOpen, setFastBidOpen] = useState(false);
  const [privateTopupIntroOpen, setPrivateTopupIntroOpen] = useState(false);
  const [privateTopupGuideOpen, setPrivateTopupGuideOpen] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  const loginLabel = useMemo(() => {
    if (!hydrated) {
      return "Login";
    }

    if (loginInProgress) {
      return loginStep ? LOGIN_STEP_LABELS[loginStep] : "Connecting...";
    }

    return "Login";
  }, [hydrated, loginInProgress, loginStep]);

  const balanceDisplay = useMemo(() => {
    if (cashStatus === "loading") {
      return "-";
    }

    return formatNumber(cash?.available, 2, true, {
      round: 0,
      isZeroPrecision: true,
    });
  }, [cash?.available, cashStatus]);

  function handleLogin() {
    setMessage(undefined);
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
      <div className="relative inline-flex flex-col items-end">
        <WalletLoginButton
          label={loginLabel}
          disabled={!hydrated || loginInProgress}
          onClick={handleLogin}
        />
        {(message ?? error) ? (
          <p className="mt-2 max-w-[220px] text-right text-xs text-prophet-red">
            {message ?? error}
          </p>
        ) : null}
      </div>
    );
  }

  const polymarketAddress = session.funderAddress ?? session.walletAddress;

  return (
    <div ref={menuRef} className="relative inline-flex flex-col items-end">
      <WalletConnectedBar
        polymarketAddress={polymarketAddress}
        balanceDisplay={balanceDisplay}
        isMenuOpen={isOpen}
        regionRestricted={isRegionBlocked}
        onDeposit={() => setDepositOpen(true)}
        onPrivateTopup={() => setPrivateTopupIntroOpen(true)}
        onPrivateBalanceClick={() => setPrivateTopupIntroOpen(true)}
        onToggleMenu={() => setIsOpen((value) => !value)}
        isPrivateMode={isPrivateMode}
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
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onOpenPrivateTopup={() => {
          setDepositOpen(false);
          setPrivateTopupIntroOpen(true);
        }}
      />

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

      <MobileDrawer
        open={isMobileDrawerOpen}
        onClose={onMobileDrawerClose}
        regionRestricted={isRegionBlocked}
        onPrivateBalanceClick={() => setPrivateTopupIntroOpen(true)}
        balanceDisplay={balanceDisplay}
      />
    </div>
  );
}
