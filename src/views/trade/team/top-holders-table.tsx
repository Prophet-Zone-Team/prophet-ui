"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { debounceEffect } from "@/lib/team/debounced-effect";
import { fetchJson } from "@/lib/team/client-fetch";
import { formatShortWallet } from "@/lib/team/detail-format";
import type { MarketTopHolder, MarketTopHolderGroup, TeamMarketSnapshot } from "@/types/market";

interface TopHoldersTableProps {
  snapshot: TeamMarketSnapshot;
  active: boolean;
}

interface TopHolderRow {
  key: string;
  label: string;
  outcome: string;
  amount: number;
}

function resolveHolderLabel(holder: MarketTopHolder): string {
  if (holder.displayUsernamePublic && holder.name?.trim()) {
    return holder.name.trim();
  }

  if (holder.pseudonym?.trim()) {
    return holder.pseudonym.trim();
  }

  return formatShortWallet(holder.proxyWallet);
}

function resolveOutcomeLabel(
  holder: MarketTopHolder,
  labels: {
    yesTokenId?: string;
    noTokenId?: string;
    yesLabel: string;
    noLabel: string;
  },
): string {
  if (holder.asset === labels.yesTokenId) {
    return labels.yesLabel;
  }

  if (holder.asset === labels.noTokenId) {
    return labels.noLabel;
  }

  if (holder.outcomeIndex === 0) {
    return labels.yesLabel;
  }

  if (holder.outcomeIndex === 1) {
    return labels.noLabel;
  }

  return `Outcome ${holder.outcomeIndex + 1}`;
}

function flattenTopHolders(
  groups: MarketTopHolderGroup[],
  labels: {
    yesTokenId?: string;
    noTokenId?: string;
    yesLabel: string;
    noLabel: string;
  },
): TopHolderRow[] {
  return groups
    .flatMap((group) =>
      group.holders.map((holder) => ({
        key: `${group.token}:${holder.proxyWallet}:${holder.outcomeIndex}`,
        label: resolveHolderLabel(holder),
        outcome: resolveOutcomeLabel(holder, labels),
        amount: holder.amount,
      })),
    )
    .sort((left, right) => right.amount - left.amount);
}

export function TopHoldersTable({ snapshot, active }: TopHoldersTableProps) {
  const conditionId = snapshot.market.polymarket?.conditionId;
  const [rows, setRows] = useState<TopHolderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnceRef = useRef(false);

  const emptyMessage = useMemo(
    () => `No public holder data available for ${snapshot.team.name}.`,
    [snapshot.team.name],
  );

  const yesTokenId = snapshot.market.polymarket?.tokens?.yes?.tokenId;
  const noTokenId = snapshot.market.polymarket?.tokens?.no?.tokenId;
  const yesLabel = snapshot.market.polymarket?.tokens?.yes?.outcome ?? "Yes";
  const noLabel = snapshot.market.polymarket?.tokens?.no?.outcome ?? "No";

  useEffect(() => {
    if (!active) {
      return;
    }

    let ignore = false;

    async function load() {
      const silent = hasLoadedOnceRef.current;

      if (!silent) {
        setLoading(true);
        setError(null);
      }

      if (!conditionId) {
        if (!ignore) {
          setRows([]);
          setLoading(false);
        }
        return;
      }

      try {
        const payload = await fetchJson<{ holders?: MarketTopHolderGroup[] }>(
          `/api/market/holders?market=${encodeURIComponent(conditionId)}&limit=20`,
        );
        const nextRows = flattenTopHolders(payload.holders ?? [], {
          yesTokenId,
          noTokenId,
          yesLabel,
          noLabel,
        });

        if (!ignore) {
          setRows(nextRows);
        }
      } catch (loadError) {
        if (!ignore && !silent) {
          setRows([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load top holders.",
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
          hasLoadedOnceRef.current = true;
        }
      }
    }

    const cancelDebounce = debounceEffect(() => {
      if (!ignore) {
        void load();
      }
    });

    return () => {
      ignore = true;
      cancelDebounce();
    };
  }, [active, conditionId, yesTokenId, noTokenId, yesLabel, noLabel]);

  const hasData = rows.length > 0;

  if (!conditionId) {
    return (
      <p className="px-4 py-10 text-center text-sm text-prophet-muted">
        Holder data is unavailable because this market has no connected condition
        ID.
      </p>
    );
  }

  if (error && !hasData) {
    return (
      <div className="px-4 py-10 text-center">
        <strong className="block text-sm font-[556] text-black">
          Top holders unavailable
        </strong>
        <p className="m-0 mt-2 text-sm text-prophet-muted">{error}</p>
      </div>
    );
  }

  if (loading && !hasData && !error) {
    return (
      <p className="px-4 py-8 text-center text-sm text-prophet-muted">
        Loading top holders…
      </p>
    );
  }

  if (!loading && !hasData && !error) {
    return (
      <p className="px-4 py-10 text-center text-sm text-prophet-muted">
        {emptyMessage}
      </p>
    );
  }

  if (!hasData) {
    return null;
  }

  return (
    <div>
      {rows.map((row) => (
        <div
          key={row.key}
          className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-2 border-b border-prophet-line/60 px-4 py-2.5 text-sm last:border-b-0"
        >
          <strong className="truncate font-[556]">{row.label}</strong>
          <span className="truncate text-prophet-muted">{row.outcome}</span>
          <span className="tabular-nums">
            {row.amount.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TopHoldersTableHeader() {
  return (
    <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-2 border-b border-prophet-line px-4 py-2 text-xs text-prophet-muted">
      <span>Holder</span>
      <span>Outcome</span>
      <span>Size</span>
    </div>
  );
}
