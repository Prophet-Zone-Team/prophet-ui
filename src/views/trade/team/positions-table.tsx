"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { getGameTokenIds } from "@/lib/market/game-outcome-price";
import { resolveMatchSides } from "@/lib/market/schedule-match";
import { fetchJson } from "@/lib/team/client-fetch";
import {
  formatShortWallet,
  formatTeamDetailMoney
} from "@/lib/team/detail-format";
import type {
  GameMarketSnapshot,
  TeamMarketSnapshot,
  UserPositionRecord
} from "@/types/market";
import { useAuth } from "@/context/auth";
import { tradeBidButtonClass } from "@/views/trade/trade-widget/trade-ui";

export type PositionsTableTeamProps = {
  variant?: "team";
  snapshot: TeamMarketSnapshot;
};

export type PositionsTableGameProps = {
  variant: "game";
  gameSnapshot: GameMarketSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
};

export type PositionsTableProps =
  | PositionsTableTeamProps
  | PositionsTableGameProps;

function getTeamTokenIds(snapshot: TeamMarketSnapshot): string[] {
  const tokens = snapshot.market.polymarket?.tokens;
  return [tokens?.yes?.tokenId, tokens?.no?.tokenId].filter(
    (id): id is string => Boolean(id)
  );
}

function resolveEmptyMessage(props: PositionsTableProps): string {
  if (props.variant === "game") {
    const sides = resolveMatchSides(
      props.gameSnapshot.match,
      props.teamSnapshots
    );
    return `No open positions for ${sides.home.name} vs ${sides.away.name} in your connected account.`;
  }

  return `No open positions for ${props.snapshot.team.name} in your connected account.`;
}

export function PositionsTable(props: PositionsTableProps) {
  const { isAuthenticated, openLogin } = useAuth();
  const [positions, setPositions] = useState<UserPositionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const tokenIds = useMemo(() => {
    if (props.variant === "game") {
      return getGameTokenIds(props.gameSnapshot);
    }

    return getTeamTokenIds(props.snapshot);
  }, [props]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);

      try {
        if (!isAuthenticated) {
          if (!ignore) {
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
  }, [isAuthenticated, tokenIds]);

  if (loading) {
    return (
      <p className="px-4 py-8 text-center text-sm text-prophet-muted">
        Loading positions…
      </p>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-10">
        <p className="m-0 text-sm text-prophet-muted">
          Connect your wallet to view positions for this market.
        </p>
        <button
          type="button"
          className={cn(tradeBidButtonClass, "max-w-xs")}
          onClick={() => void openLogin()}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-prophet-muted">
        {resolveEmptyMessage(props)}
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
