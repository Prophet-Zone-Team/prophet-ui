"use client";

import { useState, type MouseEventHandler } from "react";

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

function PositionsTableHeader() {
  return (
    <div
      className={cn(
        copyWalletPositionsGridClass,
        "px-4 py-2 text-[14px] leading-[18px] text-[#909090]"
      )}
    >
      <span className="font-[500]">Market</span>
      <span>AVG</span>
      <span>Current</span>
      <span>Value</span>
      <span className="justify-self-end text-right">Time</span>
    </div>
  );
}

function PositionsEmptyState({ status }: { status: CopyWalletPositionStatus }) {
  return (
    <p className="border-t border-[#EBEBEB] px-4 py-6 text-center text-[14px] leading-[18px] text-[#909090]">
      {status === "active" ? "No active positions." : "No ended positions."}
    </p>
  );
}

function PositionsErrorState({ message }: { message: string }) {
  return (
    <p className="border-t border-[#EBEBEB] px-4 py-6 text-center text-[14px] leading-[18px] text-[#FF674B]">
      {message}
    </p>
  );
}

function PositionsLoadingState() {
  return (
    <p className="border-t border-[#EBEBEB] px-4 py-6 text-center text-[14px] leading-[18px] text-[#909090]">
      Loading positions…
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
        selected ? "text-black" : "text-[#909090]"
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
      className={cn("border-t border-[#EBEBEB]", className)}
      onClick={onClick}
    >
      <div className="flex items-center gap-4 px-4 pt-3">
        <PositionsTab
          label="Active"
          selected={status === "active"}
          onClick={() => handleStatusChange("active")}
        />
        <PositionsTab
          label="Ended"
          selected={status === "ended"}
          onClick={() => handleStatusChange("ended")}
        />
      </div>

      <div className="mt-2 pb-1">
        <PositionsTableHeader />
        {loading ? (
          <PositionsLoadingState />
        ) : error ? (
          <PositionsErrorState message={error} />
        ) : positions.length > 0 ? (
          positions.map((position) => (
            <CopyWalletPositionRow key={position.id} position={position} />
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
