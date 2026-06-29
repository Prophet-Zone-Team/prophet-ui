"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { traderRowKey } from "@/lib/copy-trade/trader-catalog-stats";
import { CopyTradeListStatusMessage } from "@/views/copy-trade/list/status-message";
import { useCopyTradeTracks } from "@/views/copy-trade/use-copy-trade-tracks";

import { TracksEmptyState } from "./empty-state";
import { TracksItem } from "./item";
import { TracksTableHeader } from "./table-header";

export interface TracksListProps {
  className?: string;
  enabled?: boolean;
  importDisabled?: boolean;
  onImport?: () => void;
}

export function TracksList({
  className,
  enabled = true,
  importDisabled = false,
  onImport
}: TracksListProps) {
  const t = useTranslations("copyTrade.activity");
  const { tracks, isLoading, isError, error } = useCopyTradeTracks({ enabled });

  if (isLoading) {
    return (
      <CopyTradeListStatusMessage
        className={cn("min-h-0 flex-1 px-3 py-4", className)}
      >
        {t("loadingTracks")}
      </CopyTradeListStatusMessage>
    );
  }

  if (isError) {
    return (
      <CopyTradeListStatusMessage
        className={cn("min-h-0 flex-1 px-3 py-4", className)}
      >
        {error instanceof Error ? error.message : t("unableToLoadTracks")}
      </CopyTradeListStatusMessage>
    );
  }

  if (tracks.length === 0) {
    return (
      <TracksEmptyState
        className={cn("min-h-0 flex-1 px-3 py-4", className)}
        disabled={importDisabled}
        onImport={onImport}
      />
    );
  }

  return (
    <div
      className={cn("flex min-h-0 flex-1 flex-col px-3", className)}
      aria-label={t("ariaTracks")}
    >
      <TracksTableHeader />
      <ul className="mt-3 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        {tracks.map((trader) => (
          <li key={traderRowKey(trader)}>
            <TracksItem trader={trader} />
          </li>
        ))}
      </ul>
    </div>
  );
}
