"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { useAuth } from "@/context/auth";
import { cn } from "@/lib/cn";
import type { OpenOrderMarketGroup } from "@/lib/portfolio/group-open-orders";
import { resolveOpenOrderMarketTitle } from "@/lib/portfolio/group-open-orders";
import { resolvePortfolioPositionTradeHref } from "@/lib/portfolio/resolve-position-trade-href";
import {
  resolvePortfolioMarketIcon,
  type OpenOrderMarketContext
} from "@/lib/portfolio/teams-condition";
import { PortfolioMarketCell } from "@/views/portfolio/portfolio-market-cell";
import { PortfolioOpenOrderCancelAllDialog } from "@/views/portfolio/portfolio-open-order-cancel-all-dialog";
import { PortfolioOpenOrderRows } from "@/views/portfolio/portfolio-open-order-rows";
import { portfolioActionButtonClass } from "@/views/portfolio/portfolio-ui";

const SUMMARY_GRID =
  "grid w-full grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] items-center gap-x-3";

const SUMMARY_LABEL_CLASS =
  "font-[Sora] text-sm font-normal leading-normal text-[#909090]";

export type PortfolioOpenOrderMarketCardProps = {
  group: OpenOrderMarketGroup;
  marketContextMap: Record<string, OpenOrderMarketContext>;
  defaultExpanded?: boolean;
  className?: string;
};

export function PortfolioOpenOrderMarketCard({
  group,
  marketContextMap,
  defaultExpanded = true,
  className
}: PortfolioOpenOrderMarketCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [cancelAllOpen, setCancelAllOpen] = useState(false);
  const { isRegionBlocked } = useAuth();
  const regionRestricted = isRegionBlocked;

  const marketContext = marketContextMap[group.marketId];
  const marketTitle = useMemo(() => {
    const firstOrder = group.orders[0];

    if (!firstOrder) {
      return group.marketId;
    }

    return resolveOpenOrderMarketTitle(firstOrder, marketContextMap);
  }, [group.marketId, group.orders, marketContextMap]);
  const teams = marketContext?.teams ?? [];
  const tradeHref = resolvePortfolioPositionTradeHref(
    { slug: marketContext?.slug || "" },
    teams
  );
  const marketIcon = useMemo(() => {
    const firstOrder = group.orders[0];

    if (!firstOrder) {
      return undefined;
    }

    return resolvePortfolioMarketIcon(teams, firstOrder.outcome);
  }, [group.orders, teams]);
  const orderCount = group.orders.length;
  const orderLabel = orderCount === 1 ? "order" : "orders";

  return (
    <>
      <article
        className={cn("overflow-hidden border-b border-[#EBEBEB]", className)}
        aria-label={marketTitle}
      >
        <div className="overflow-x-auto">
          <div
            className={cn(
              SUMMARY_GRID,
              "min-w-[640px] bg-white px-4 pb-4 pt-4"
            )}
          >
            <div className="min-w-0">
              <PortfolioMarketCell
                title={marketTitle}
                href={tradeHref}
                outcome=""
                icon={marketIcon}
              />
            </div>
            <span className="font-[Sora] text-base font-normal leading-5 text-black tabular-nums">
              {orderCount} {orderLabel}
            </span>
            <div className="flex shrink-0 items-center justify-end gap-2 self-center">
              <RegionRestrictedControl restricted={regionRestricted}>
                <button
                  type="button"
                  className={cn(
                    portfolioActionButtonClass,
                    "disabled:opacity-50"
                  )}
                  disabled={regionRestricted}
                  onClick={() => {
                    if (!regionRestricted) {
                      setCancelAllOpen(true);
                    }
                  }}
                >
                  Cancel All
                </button>
              </RegionRestrictedControl>
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
                aria-label={
                  expanded ? "Collapse market orders" : "Expand market orders"
                }
                className={cn(
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
                  "border border-[#EBEBEB] bg-white text-black transition-colors hover:bg-[#fafafa]"
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
          <PortfolioOpenOrderRows
            orders={group.orders}
            marketTitle={marketTitle}
          />
        ) : null}
      </article>

      {cancelAllOpen ? (
        <PortfolioOpenOrderCancelAllDialog
          open
          marketId={group.marketId}
          marketTitle={marketTitle}
          orders={group.orders}
          onClose={() => setCancelAllOpen(false)}
        />
      ) : null}
    </>
  );
}
