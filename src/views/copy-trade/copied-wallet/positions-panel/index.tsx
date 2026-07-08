"use client";

import { useState, type MouseEventHandler } from "react";
import { useTranslations } from "next-intl";

import { Pagination } from "@/components/pagination/pagination";
import { cn } from "@/lib/cn";

import { COPY_WALLET_POSITIONS_PAGE_SIZE } from "./constants";
import { copyWalletPositionsGridClass } from "./grid";
import { CopyWalletPositionRow } from "./row";
import type {
  CopyWalletPositionDisplay,
  CopyWalletPositionStatus
} from "./types";

export interface CopyTradeCopiedWalletPositionsPanelProps {
  activePositions: CopyWalletPositionDisplay[];
  endedPositions: CopyWalletPositionDisplay[];
  activePage: number;
  endedPage: number;
  activeHasMore: boolean;
  endedHasMore: boolean;
  loadingActive: boolean;
  loadingEnded: boolean;
  errorActive?: string;
  errorEnded?: string;
  onActivePageChange: (page: number) => void;
  onEndedPageChange: (page: number) => void;
  onStatusChange?: (status: CopyWalletPositionStatus) => void;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

function PositionsTableHeader({
  status
}: {
  status: CopyWalletPositionStatus;
}) {
  const t = useTranslations("copyTrade.copiedWallet.positions");
  const timeLabel = status === "ended" ? t("settlementTime") : t("time");

  return (
    <div
      className={cn(
        copyWalletPositionsGridClass,
        "hidden px-4 py-2 text-[14px] leading-[18px] text-prophet-muted md:grid"
      )}
    >
      <span className="font-[500]">{t("market")}</span>
      <span>{t("avg")}</span>
      <span>{t("current")}</span>
      <span>{t("value")}</span>
      <span className="justify-self-end text-right">{timeLabel}</span>
    </div>
  );
}

function PositionsEmptyState({ status }: { status: CopyWalletPositionStatus }) {
  const t = useTranslations("copyTrade.copiedWallet.positions");

  return (
    <p className="border-t border-prophet-line px-4 py-6 text-center text-[14px] leading-[18px] text-prophet-muted">
      {status === "active" ? t("noActive") : t("noEnded")}
    </p>
  );
}

function PositionsErrorState({ message }: { message: string }) {
  return (
    <p className="border-t border-prophet-line px-4 py-6 text-center text-[14px] leading-[18px] text-[#FF674B]">
      {message}
    </p>
  );
}

function PositionsLoadingState() {
  const t = useTranslations("copyTrade.copiedWallet.positions");

  return (
    <p className="border-t border-prophet-line px-4 py-6 text-center text-[14px] leading-[18px] text-prophet-muted">
      {t("loading")}
    </p>
  );
}

function PositionsTab({
  label,
  selected,
  onClick
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "text-[14px] leading-[18px] transition-opacity hover:opacity-70",
        selected ? "text-prophet-foreground" : "text-prophet-muted"
      )}
      aria-pressed={selected}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function CopyTradeCopiedWalletPositionsPanel({
  activePositions,
  endedPositions,
  activePage,
  endedPage,
  activeHasMore,
  endedHasMore,
  loadingActive,
  loadingEnded,
  errorActive,
  errorEnded,
  onActivePageChange,
  onEndedPageChange,
  onStatusChange,
  className,
  onClick
}: CopyTradeCopiedWalletPositionsPanelProps) {
  const t = useTranslations("copyTrade.copiedWallet.positions");
  const [status, setStatus] = useState<CopyWalletPositionStatus>("active");

  const handleStatusChange = (nextStatus: CopyWalletPositionStatus) => {
    setStatus(nextStatus);
    onStatusChange?.(nextStatus);
  };

  const positions = status === "active" ? activePositions : endedPositions;
  const page = status === "active" ? activePage : endedPage;
  const hasMore = status === "active" ? activeHasMore : endedHasMore;
  const loading = status === "active" ? loadingActive : loadingEnded;
  const error = status === "active" ? errorActive : errorEnded;
  const onPageChange =
    status === "active" ? onActivePageChange : onEndedPageChange;

  return (
    <div
      className={cn("border-t border-prophet-line", className)}
      onClick={onClick}
    >
      <div className="flex items-center gap-4 px-4 pt-3">
        <PositionsTab
          label={t("active")}
          selected={status === "active"}
          onClick={() => handleStatusChange("active")}
        />
        <PositionsTab
          label={t("ended")}
          selected={status === "ended"}
          onClick={() => handleStatusChange("ended")}
        />
      </div>

      <div className="mt-2 pb-1">
        <PositionsTableHeader status={status} />
        {loading ? (
          <PositionsLoadingState />
        ) : error ? (
          <PositionsErrorState message={error} />
        ) : positions.length > 0 ? (
          positions.map((position) => (
            <CopyWalletPositionRow
              key={position.id}
              position={position}
              status={status}
            />
          ))
        ) : (
          <PositionsEmptyState status={status} />
        )}

        {!loading && !error && (page > 1 || hasMore) ? (
          <Pagination
            page={page}
            pageSize={COPY_WALLET_POSITIONS_PAGE_SIZE}
            total={page * COPY_WALLET_POSITIONS_PAGE_SIZE}
            hasMore={hasMore}
            showTotalPages={false}
            onPageChange={onPageChange}
            className="px-4 py-3"
          />
        ) : null}
      </div>
    </div>
  );
}
