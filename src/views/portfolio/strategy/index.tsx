"use client";

import { useEffect, useMemo, useRef } from "react";

import { enrichPortfolioStrategyRecords } from "@/lib/portfolio/compute-portfolio-strategy-summary";
import { useWinnerSnapshots } from "@/store";
import { PortfolioEmptyState } from "@/views/portfolio/portfolio-empty-state";
import {
  portfolioConnectButtonClass,
  portfolioTableScrollClass
} from "@/views/portfolio/portfolio-ui";

import { PortfolioStrategyCard } from "./portfolio-strategy-card";
import { usePortfolioStrategies } from "./use-portfolio-strategies";

export type PortfolioStrategyListProps = {
  active: boolean;
  sessionConnected: boolean;
  onConnectWallet: () => void;
};

export function PortfolioStrategyList({
  active,
  sessionConnected,
  onConnectWallet
}: PortfolioStrategyListProps) {
  const { strategies, status, loadStrategies, hasLoadedRef } =
    usePortfolioStrategies(sessionConnected);
  const snapshots = useWinnerSnapshots();
  const enrichedStrategies = useMemo(
    () => enrichPortfolioStrategyRecords(strategies, snapshots),
    [strategies, snapshots]
  );
  const prevActiveRef = useRef(false);

  useEffect(() => {
    const becameActive = active && !prevActiveRef.current;
    prevActiveRef.current = active;

    if (!becameActive) {
      return;
    }

    void loadStrategies(
      hasLoadedRef.current ? { force: true, silent: true } : undefined
    );
  }, [active, hasLoadedRef, loadStrategies]);

  const loading = sessionConnected && (status === "loading" || status === "idle");
  const needsWallet = !sessionConnected && !loading;

  if (loading) {
    return (
      <p className="px-4 py-8 text-center text-sm text-prophet-muted">
        Loading strategies…
      </p>
    );
  }

  if (needsWallet) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-10">
        <p className="m-0 text-sm text-prophet-muted">
          Connect your wallet to view strategies in your connected account.
        </p>
        <button
          type="button"
          className={portfolioConnectButtonClass}
          onClick={() => void onConnectWallet()}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
        <p className="m-0 text-sm text-prophet-muted">
          Unable to load strategies right now.
        </p>
        <button
          type="button"
          className={portfolioConnectButtonClass}
          onClick={() => void loadStrategies({ force: true })}
        >
          Retry
        </button>
      </div>
    );
  }

  if (enrichedStrategies.length === 0) {
    return (
      <PortfolioEmptyState
        title="No strategies yet"
        body="Strategy positions will appear here after you place a strategy bid."
      />
    );
  }

  return (
    <div className={portfolioTableScrollClass} aria-label="Your strategies">
      <div className="flex flex-col">
        {enrichedStrategies.map((strategy) => (
          <PortfolioStrategyCard key={strategy.id} strategy={strategy} />
        ))}
      </div>
    </div>
  );
}
