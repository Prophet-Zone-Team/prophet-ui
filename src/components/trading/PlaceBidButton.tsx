"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { connectTradingWallet, loadTradingSession } from "./tradingWalletSession";

export function PlaceBidButton() {
  const router = useRouter();
  const marketsHref = "/markets";
  const [hasSession, setHasSession] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    let ignore = false;

    loadTradingSession()
      .then((session) => {
        if (!ignore) {
          setHasSession(Boolean(session));
        }
      })
      .catch(() => undefined);

    return () => {
      ignore = true;
    };
  }, []);

  async function handlePlaceBid() {
    setMessage(undefined);
    setIsChecking(true);

    try {
      const connected = hasSession || Boolean(await loadTradingSession());

      if (connected) {
        router.push(marketsHref);
        return;
      }

      setIsModalOpen(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
      setIsModalOpen(true);
    } finally {
      setIsChecking(false);
    }
  }

  async function connectWallet() {
    setMessage(undefined);
    setIsConnecting(true);

    try {
      await connectTradingWallet();
      setHasSession(true);
      setIsModalOpen(false);
      router.push(marketsHref);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="bid-button"
        aria-haspopup="dialog"
        aria-expanded={isModalOpen}
        onClick={handlePlaceBid}
        disabled={isChecking}
      >
        {isChecking ? "Checking..." : "Place a Bid"}
        <ArrowIcon />
      </button>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="place-bid-connect-title"
        >
          <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 text-slate-950 shadow-2xl">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-blue-600">Wallet required</p>
            <h2 id="place-bid-connect-title" className="mt-3 text-xl font-extrabold leading-tight">
              Connect your wallet first.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              A user-owned wallet session is required before opening the order flow. After connection, you can choose a
              market from the probability board.
            </p>
            {message ? (
              <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
                {message}
              </p>
            ) : null}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="rounded border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                onClick={connectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting..." : "Connect wallet"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}
