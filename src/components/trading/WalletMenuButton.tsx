"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { MarketDataMeta } from "../../data/providers/types";
import type { TradingUserSession } from "../../types/market";
import {
  connectTradingWallet,
  disconnectTradingSession,
  formatShortWalletAddress,
  loadTradingSession,
} from "./tradingWalletSession";

interface WalletMenuButtonProps {
  source: MarketDataMeta["source"];
}

export function WalletMenuButton({ source }: WalletMenuButtonProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<TradingUserSession | undefined>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    let ignore = false;

    loadTradingSession()
      .then((record) => {
        if (!ignore) {
          setSession(record);
        }
      })
      .catch(() => undefined);

    return () => {
      ignore = true;
    };
  }, []);

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
      setSession(await connectTradingWallet());
      setIsOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsConnecting(false);
    }
  }

  async function logout() {
    setMessage(undefined);

    try {
      await disconnectTradingSession();
      setSession(undefined);
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
          <Link role="menuitem" href={`/bid?source=${source}`} onClick={() => setIsOpen(false)}>
            Profile
          </Link>
          <button type="button" role="menuitem" onClick={logout}>
            Logout
          </button>
        </div>
      ) : null}
      {message ? <p className="wallet-menu-error">{message}</p> : null}
    </div>
  );
}

function ChevronIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>;
}
