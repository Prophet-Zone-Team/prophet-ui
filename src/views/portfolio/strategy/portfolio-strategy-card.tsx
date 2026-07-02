"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import {
  canPortfolioStrategyBidAgain,
  resolveAvailableStrategyForPortfolio
} from "@/lib/strategy/resolve-portfolio-strategy-bid";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import { useWinnerSnapshots, useWinnerTeamsStore } from "@/store";
import { StrategyBidModal } from "@/views/strategy/components/bid-modal";

import { PORTFOLIO_STRATEGY_STATUS_CONFIG } from "@/lib/strategy/portfolio-strategy-status";

import { PortfolioStrategyLegsTable } from "./portfolio-strategy-legs-table";
import type { PortfolioStrategyRecord, PortfolioStrategyStatus } from "./types";

const PORTFOLIO_STRATEGY_STATUS_MESSAGE_KEYS: Record<
  PortfolioStrategyStatus,
  "strategyStatusNotOpen" | "strategyStatusHitSucceed" | "strategyStatusNotFinished" | "strategyStatusHitMissed"
> = {
  not_open: "strategyStatusNotOpen",
  hit_succeed: "strategyStatusHitSucceed",
  not_finished: "strategyStatusNotFinished",
  hit_missed: "strategyStatusHitMissed"
};

const SUMMARY_GRID =
  "grid w-full grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto] items-center gap-x-3";

const SUMMARY_LABEL_CLASS =
  "font-[Sora] text-sm font-normal leading-normal text-prophet-muted";

const SUMMARY_VALUE_CLASS =
  "font-[Sora] text-base font-normal capitalize leading-5 text-prophet-foreground";

const BID_AGAIN_BUTTON_CLASS =
  "inline-flex h-[32px] min-w-[96px] items-center justify-center gap-1 rounded-lg bg-[#18110F] dark:bg-prophet-primary px-2 text-xs font-medium leading-[15px] text-white transition-opacity hover:opacity-90";

export type PortfolioStrategyCardProps = {
  strategy: PortfolioStrategyRecord;
  defaultExpanded?: boolean;
  onStrategyUpdated?: () => void;
  className?: string;
};

export function PortfolioStrategyCard({
  strategy,
  defaultExpanded = true,
  onStrategyUpdated,
  className
}: PortfolioStrategyCardProps) {
  const t = useTranslations("portfolio");
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const snapshots = useWinnerSnapshots();
  const fetchEvent = useWinnerTeamsStore((state) => state.fetchEvent);
  const statusDisplay = PORTFOLIO_STRATEGY_STATUS_CONFIG[strategy.status];

  useEffect(() => {
    void fetchEvent();
  }, [fetchEvent]);

  const bidStrategy = useMemo(
    () => resolveAvailableStrategyForPortfolio(strategy, snapshots),
    [strategy, snapshots]
  );
  const showBidAgain = canPortfolioStrategyBidAgain(strategy);

  const handleBidModalClose = () => {
    setBidModalOpen(false);
    onStrategyUpdated?.();
  };

  return (
    <>
      <article
        className={cn("overflow-hidden border-b border-prophet-line", className)}
        aria-label={strategy.name}
      >
        <div className="overflow-x-auto">
          <div className={cn(SUMMARY_GRID, "min-w-[720px] bg-prophet-panel px-4 pb-4 pt-4")}>
            <span className={cn(SUMMARY_LABEL_CLASS, "pb-2")} role="columnheader">
              {t("strategy")}
            </span>
            <span className={cn(SUMMARY_LABEL_CLASS, "pb-2")} role="columnheader">
              {t("roi")}
            </span>
            <span className={cn(SUMMARY_LABEL_CLASS, "pb-2")} role="columnheader">
              {t("value")}
            </span>
            <span className={cn(SUMMARY_LABEL_CLASS, "pb-2")} role="columnheader">
              {t("hitReturn")}
            </span>
            <span className={cn(SUMMARY_LABEL_CLASS, "pb-2")} role="columnheader">
              {t("status")}
            </span>
            <div className="pb-2" aria-hidden />
            <h3 className="m-0 min-w-0 truncate font-[Sora] text-base font-semibold capitalize leading-5 text-prophet-foreground">
              {strategy.name}
            </h3>
            <span className={cn(SUMMARY_VALUE_CLASS, "min-w-0 truncate")}>
              {strategy.roiLabel}
            </span>
            <span className={cn(SUMMARY_VALUE_CLASS, "min-w-0 truncate tabular-nums")}>
              {formatTeamDetailMoney(strategy.value)}
            </span>
            <span className={cn(SUMMARY_VALUE_CLASS, "min-w-0 truncate tabular-nums")}>
              {strategy.hitReturnLabel}
            </span>
            <PortfolioStrategyStatus
              label={t(PORTFOLIO_STRATEGY_STATUS_MESSAGE_KEYS[strategy.status])}
              color={statusDisplay.color}
            />
            <div className="flex shrink-0 items-center justify-end gap-2 self-center">
              {showBidAgain ? (
                <button
                  type="button"
                  className={BID_AGAIN_BUTTON_CLASS}
                  onClick={() => setBidModalOpen(true)}
                >
                  {t("bidAgain")}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
                aria-label={
                  expanded ? t("collapseStrategyLegs") : t("expandStrategyLegs")
                }
                className={cn(
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
                  "border border-prophet-line bg-prophet-panel text-prophet-foreground transition-colors hover:bg-prophet-hover"
                )}
              >
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 transition-transform duration-200",
                    expanded && "rotate-180"
                  )}
                  aria-hidden
                />
              </button>
            </div>
          </div>
        </div>

        {expanded ? (
          <PortfolioStrategyLegsTable legs={strategy.legs} />
        ) : null}
      </article>

      <StrategyBidModal
        open={bidModalOpen}
        onClose={handleBidModalClose}
        strategy={bidStrategy}
        snapshots={snapshots}
      />
    </>
  );
}

function PortfolioStrategyStatus({
  label,
  color
}: {
  label: string;
  color: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span
        className="font-[Sora] text-base font-normal capitalize leading-5"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}
