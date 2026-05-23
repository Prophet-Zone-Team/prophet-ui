"use client";
import { useEffect, useRef, useState } from "react";

import { prepareQuickBidAccount, QuickBidApprovalPendingError } from "@/components/trading/quick-bid-account-setup";
import {
  formatQuickBidAmount,
  readQuickBidAmount,
  subscribeQuickBidAmountChange,
  writeActiveQuickBidWalletAddress,
  writeQuickBidAmount,
} from "@/components/trading/quick-bid-amount";
import { formatShortWalletAddress } from "@/components/trading/trading-wallet-session";
import { useAuth } from "@/context/auth";

const loginButtonClassName =
  "inline-flex h-10 min-w-[168px] items-center justify-center gap-4 px-4 text-[13px] font-extrabold text-black disabled:cursor-wait disabled:opacity-70";

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

export function WalletMenuButton() {
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    session,
    hydrated,
    isAuthenticated,
    loginInProgress,
    loginStep,
    error,
    openLogin,
    disconnect,
  } = useAuth();
  const [isPreparingQuickBid, setIsPreparingQuickBid] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [quickBidAmount, setQuickBidAmount] = useState(() => readQuickBidAmount());
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    writeActiveQuickBidWalletAddress(session?.walletAddress);
    setQuickBidAmount(readQuickBidAmount(session?.walletAddress));
  }, [session?.walletAddress]);

  useEffect(() => {
    return subscribeQuickBidAmountChange(() => {
      setQuickBidAmount(readQuickBidAmount(session?.walletAddress));
    });
  }, [session?.walletAddress]);

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

  async function handleLogin() {
    setMessage(undefined);

    try {
      await openLogin();
      setIsOpen(false);
    } catch (loginError) {
      setMessage(loginError instanceof Error ? loginError.message : String(loginError));
    }
  }

  async function enableQuickBid() {
    if (!session || !isAuthenticated) {
      return;
    }

    setMessage(undefined);
    setIsPreparingQuickBid(true);

    try {
      await prepareQuickBidAccount({
        session,
        onStatus: setMessage,
      });
      setMessage(`Quick Bid is enabled at ${formatQuickBidAmount(quickBidAmount)} USDC.`);
    } catch (error) {
      if (error instanceof QuickBidApprovalPendingError) {
        setMessage(error.message);
        return;
      }

      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsPreparingQuickBid(false);
    }
  }

  async function logout() {
    setMessage(undefined);

    try {
      await disconnect();
      writeActiveQuickBidWalletAddress(undefined);
      setIsOpen(false);
    } catch (logoutError) {
      setMessage(logoutError instanceof Error ? logoutError.message : String(logoutError));
    }
  }

  const loginLabel = !hydrated
    ? "Login"
    : loginInProgress
      ? loginStep
        ? LOGIN_STEP_LABELS[loginStep]
        : "Connecting..."
      : isAuthenticated && session
        ? formatShortWalletAddress(session.walletAddress)
        : session
          ? formatShortWalletAddress(session.walletAddress)
          : "Login";

  if (!hydrated) {
    return (
      <div className="relative inline-flex flex-col items-end">
        <button type="button" className={loginButtonClassName} disabled>
          <LoginIcon />
          <span>{loginLabel}</span>
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="relative inline-flex flex-col items-end">
        <button
          type="button"
          className={loginButtonClassName}
          onClick={() => void handleLogin()}
          disabled={loginInProgress}
        >
          <LoginIcon />
          <span>{loginLabel}</span>
        </button>
        {(message ?? error) ? (
          <p className="mt-2 max-w-[220px] text-right text-xs text-prophet-red">
            {message ?? error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={menuRef} className="relative inline-flex flex-col items-end">
      <button
        type="button"
        className={loginButtonClassName}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={loginInProgress}
        onClick={() => setIsOpen((value) => !value)}
      >
        <LoginIcon />
        <span>
          {loginInProgress
            ? loginStep
              ? LOGIN_STEP_LABELS[loginStep]
              : "Connecting..."
            : formatShortWalletAddress(session!.walletAddress)}
        </span>
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-20 min-w-[220px] rounded-[7px] border border-prophet-line bg-white p-2 shadow-prophet"
          role="menu"
        >
          <div
            className="mb-2 border-b border-prophet-line px-2 py-2 text-xs text-prophet-muted"
            role="none"
          >
            <span className="font-extrabold text-prophet-ink">Quick Bid</span>
            <label className="mt-2 flex items-center justify-between gap-2">
              <input
                type="number"
                min="1"
                inputMode="decimal"
                value={quickBidAmount}
                className="w-20 rounded border border-prophet-line px-2 py-1 text-prophet-ink"
                onChange={(event) => {
                  const nextAmount = event.target.value;

                  setQuickBidAmount(nextAmount);

                  if (Number(nextAmount) > 0 && session) {
                    writeQuickBidAmount(nextAmount, session.walletAddress);
                  }
                }}
              />
              <b className="text-prophet-ink">USDC</b>
            </label>
          </div>
          <button
            type="button"
            role="menuitem"
            className="block w-full rounded px-2 py-2 text-left text-sm hover:bg-[#f3f8fd] disabled:opacity-60"
            disabled={isPreparingQuickBid}
            onClick={() => void enableQuickBid()}
          >
            {isPreparingQuickBid ? "Enabling Quick Bid..." : "Enable Quick Bid"}
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full rounded px-2 py-2 text-left text-sm hover:bg-[#f3f8fd]"
            onClick={() => void logout()}
          >
            Logout
          </button>
          {message ? (
            <p className="mt-2 px-2 text-xs text-prophet-muted">{message}</p>
          ) : null}
        </div>
      ) : null}
      {message && !isOpen ? (
        <p className="mt-2 max-w-[220px] text-right text-xs text-prophet-red">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function LoginIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="17"
      viewBox="0 0 18 17"
      fill="none"
      aria-hidden
    >
      <circle cx="9" cy="5" r="4" stroke="black" strokeWidth="2" />
      <path
        d="M17 17C17 14.2386 14.7614 12 12 12H6C3.23858 12 1 14.2386 1 17"
        stroke="black"
        strokeWidth="2"
      />
    </svg>
  );
}
