"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { CopyTradeListStatusMessage } from "@/views/copy-trade/list/status-message";
import { useCopyTradeTracksLatest } from "@/views/copy-trade/use-copy-trade-tracks-latest";

import { LatestEmptyState } from "./empty-state";
import { LatestItem } from "./item";

function latestItemKey(item: {
  wallet: string;
  transaction_hash: string;
  timestamp: number;
  token_id: string;
}): string {
  return `${item.wallet}:${item.transaction_hash}:${item.timestamp}:${item.token_id}`;
}

export interface LatestListProps {
  className?: string;
  enabled?: boolean;
}

export function LatestList({ className, enabled = true }: LatestListProps) {
  const t = useTranslations("copyTrade.activity");
  const { items, isLoading, isError, error } = useCopyTradeTracksLatest({
    enabled,
    limit: 20
  });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled || items.length === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [enabled, items.length]);

  if (isLoading) {
    return (
      <CopyTradeListStatusMessage
        className={cn("min-h-0 flex-1 px-2 py-4", className)}
      >
        {t("loadingLatest")}
      </CopyTradeListStatusMessage>
    );
  }

  if (isError) {
    return (
      <CopyTradeListStatusMessage
        className={cn("min-h-0 flex-1 px-2 py-4", className)}
      >
        {error instanceof Error
          ? error.message
          : t("unableToLoadLatest")}
      </CopyTradeListStatusMessage>
    );
  }

  if (items.length === 0) {
    return (
      <LatestEmptyState className={cn("min-h-0 flex-1 px-2 py-4", className)} />
    );
  }

  return (
    <ul
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2",
        className
      )}
      aria-label={t("ariaLatest")}
    >
      {items.map((item) => (
        <li key={latestItemKey(item)}>
          <LatestItem item={item} now={now} />
        </li>
      ))}
    </ul>
  );
}
