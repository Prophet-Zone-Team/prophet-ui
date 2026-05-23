"use client";
import { useEffect, useRef, useState } from "react";

import type { TradingUserSession } from "../../types/market";
import { prepareQuickBidAccount, QuickBidApprovalPendingError } from "./quick-bid-account-setup";
import {
  formatQuickBidAmount,
  readQuickBidAmount,
  subscribeQuickBidAmountChange,
  writeActiveQuickBidWalletAddress,
  writeQuickBidAmount,
} from "./quick-bid-amount";
import {
  connectTradingWallet,
  disconnectTradingSession,
  formatShortWalletAddress,
  loadTradingSession,
} from "./trading-wallet-session";

const loginButtonClassName =
  "inline-flex h-10 min-w-[168px] items-center justify-center gap-4 px-4 text-[13px] font-extrabold text-black disabled:cursor-wait disabled:opacity-70";

export function WalletMenuButton() {
  const menuRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<TradingUserSession | undefined>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPreparingQuickBid, setIsPreparingQuickBid] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [quickBidAmount, setQuickBidAmount] = useState(() => readQuickBidAmount());
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    let ignore = false;

    loadTradingSession()
      .then((record) => {
        if (!ignore) {
          setSession(record);
          writeActiveQuickBidWalletAddress(record?.walletAddress);
          setQuickBidAmount(readQuickBidAmount(record?.walletAddress));
        }
      })
      .catch(() => undefined);

    return () => {
      ignore = true;
    };
  }, []);

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

  async function connectWallet() {
    setMessage(undefined);
    setIsConnecting(true);

    try {
      const nextSession = await connectTradingWallet();
      setSession(nextSession);
      writeActiveQuickBidWalletAddress(nextSession.walletAddress);
      setQuickBidAmount(readQuickBidAmount(nextSession.walletAddress));
      setIsOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsConnecting(false);
    }
  }

  async function enableQuickBid() {
    if (!session) {
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
      await disconnectTradingSession();
      setSession(undefined);
      writeActiveQuickBidWalletAddress(undefined);
      setIsOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  const loginLabel = isConnecting
    ? "Connecting..."
    : session
      ? formatShortWalletAddress(session.walletAddress)
      : "Login";

  if (!session) {
    return (
      <div className="relative inline-flex flex-col items-end">
        <button
          type="button"
          className={loginButtonClassName}
          onClick={connectWallet}
          disabled={isConnecting}
        >
          <LoginIcon />
          <span>{loginLabel}</span>
        </button>
        {message ? (
          <p className="mt-2 max-w-[220px] text-right text-xs text-prophet-red">
            {message}
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
        onClick={() => setIsOpen((value) => !value)}
      >
        <LoginIcon />
        <span>{loginLabel}</span>
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

                  if (Number(nextAmount) > 0) {
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
            onClick={logout}
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
