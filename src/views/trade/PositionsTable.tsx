"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "../../lib/cn";
import { fetchJson } from "../../lib/team/clientFetch";
import {
  formatShortWallet,
  formatTeamDetailMoney
} from "../../lib/team/detailFormat";
import type { TeamMarketSnapshot, UserPositionRecord } from "../../types/market";
import {
  connectTradingWallet,
  loadTradingSession
} from "../../components/trading/tradingWalletSession";
import { tradeBidButtonClass } from "./tradeUi";

export interface PositionsTableProps {
  snapshot: TeamMarketSnapshot;
}

function getTeamTokenIds(snapshot: TeamMarketSnapshot): string[] {
  const tokens = snapshot.market.polymarket?.tokens;
  return [tokens?.yes?.tokenId, tokens?.no?.tokenId].filter(
    (id): id is string => Boolean(id)
  );
}

export function PositionsTable({ snapshot }: PositionsTableProps) {
  const [positions, setPositions] = useState<UserPositionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsWallet, setNeedsWallet] = useState(false);
  const tokenIds = useMemo(() => getTeamTokenIds(snapshot), [snapshot]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);

      try {
        const session = await loadTradingSession();

        if (!session) {
          if (!ignore) {
            setNeedsWallet(true);
            setPositions([]);
          }
          return;
        }

        const payload = await fetchJson<{ positions?: UserPositionRecord[] }>(
          "/api/trading/positions?limit=100"
        );
        const filtered = (payload.positions ?? []).filter((position) =>
          tokenIds.includes(position.asset)
        );

        if (!ignore) {
          setNeedsWallet(false);
          setPositions(filtered);
        }
      } catch {
        if (!ignore) {
          setPositions([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [tokenIds]);

  if (loading) {
    return <p className="px-4 py-8 text-center text-sm text-prophet-muted">Loading positions…</p>;
  }

  if (needsWallet) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-10">
        <p className="m-0 text-sm text-prophet-muted">
          Connect your wallet to view positions for this market.
        </p>
        <button
          type="button"
          className={cn(tradeBidButtonClass, "max-w-xs")}
          onClick={() => void connectTradingWallet().then(() => window.location.reload())}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-prophet-muted">
        No open positions for {snapshot.team.name} in your connected account.
      </p>
    );
  }

  return (
    <div>
      {positions.map((position) => (
        <div
          key={position.asset}
          className="grid grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,1fr))] gap-2 border-b border-prophet-line/60 px-4 py-2.5 text-sm last:border-b-0"
        >
          <strong className="truncate font-[556]">{position.outcome}</strong>
          <span>{position.size.toFixed(2)}</span>
          <span>{formatTeamDetailMoney(position.currentValue)}</span>
          <span
            className={cn(
              position.cashPnl >= 0 ? "text-prophet-green" : "text-prophet-red"
            )}
          >
            {formatTeamDetailMoney(position.cashPnl)}
          </span>
          <span>{formatShortWallet(position.proxyWallet)}</span>
        </div>
      ))}
    </div>
  );
}
