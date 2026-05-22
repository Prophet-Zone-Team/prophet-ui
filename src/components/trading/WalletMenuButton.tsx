"use client";
import { useEffect, useRef, useState } from "react";

import type { TradingUserSession } from "../../types/market";
import { prepareQuickBidAccount, QuickBidApprovalPendingError } from "./quickBidAccountSetup";
import {
  formatQuickBidAmount,
  readQuickBidAmount,
  subscribeQuickBidAmountChange,
  writeActiveQuickBidWalletAddress,
  writeQuickBidAmount,
} from "./quickBidAmount";
import {
  connectTradingWallet,
  disconnectTradingSession,
  formatShortWalletAddress,
  loadTradingSession,
} from "./tradingWalletSession";

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

  if (!session) {
    return (
      <div className="wallet-menu-shell">
        <button type="button" className="wallet-connect-button" onClick={connectWallet} disabled={isConnecting}>
          {isConnecting ? "Connecting..." : "Connect"}
        </button>
        {message ? <p className="wallet-menu-error">{message}</p> : null}
      </div>
    );
  }

  return (
    <div ref={menuRef} className="wallet-menu-shell">
      <button
        type="button"
        className="wallet-connect-button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        {formatShortWalletAddress(session.walletAddress)}
        <ChevronIcon />
      </button>

      {isOpen ? (
        <div className="wallet-dropdown" role="menu">
          <div className="wallet-quick-bid-setting" role="none">
            <span>Quick Bid</span>
            <label>
              <input
                type="number"
                min="1"
                inputMode="decimal"
                value={quickBidAmount}
                onChange={(event) => {
                  const nextAmount = event.target.value;

                  setQuickBidAmount(nextAmount);

                  if (Number(nextAmount) > 0) {
                    writeQuickBidAmount(nextAmount, session.walletAddress);
                  }
                }}
              />
              <b>USDC</b>
            </label>
          </div>
          <button type="button" role="menuitem" disabled={isPreparingQuickBid} onClick={() => void enableQuickBid()}>
            {isPreparingQuickBid ? "Enabling Quick Bid..." : "Enable Quick Bid"}
          </button>
          <button type="button" role="menuitem" onClick={logout}>
            Logout
          </button>
          {message ? <p className="wallet-dropdown-message">{message}</p> : null}
        </div>
      ) : null}
      {message && !isOpen ? <p className="wallet-menu-error">{message}</p> : null}
    </div>
  );
}

function ChevronIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>;
}
