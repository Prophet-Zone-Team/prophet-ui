"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { useAuth } from "@/context/auth";
import { cn } from "@/lib/cn";
import type { OpenOrderMarketGroup } from "@/lib/portfolio/group-open-orders";
import { resolveOpenOrderMarketTitle } from "@/lib/portfolio/group-open-orders";
import {
  formatOpenOrderExpiration,
  formatOpenOrderFilled,
  formatOpenOrderTotal
} from "@/lib/portfolio/open-order-format";
import { resolvePortfolioPositionTradeHref } from "@/lib/portfolio/resolve-position-trade-href";
import {
  resolvePortfolioMarketIcon,
  type OpenOrderMarketContext
} from "@/lib/portfolio/teams-condition";
import { PortfolioMarketCell } from "@/views/portfolio/portfolio-market-cell";
import { PortfolioOpenOrderCancelAllDialog } from "@/views/portfolio/portfolio-open-order-cancel-all-dialog";
import { PortfolioOpenOrderCancelDialog } from "@/views/portfolio/portfolio-open-order-cancel-dialog";
import {
  PortfolioOpenOrderCancelButton,
  PortfolioOpenOrderChildDesktopRow,
  PortfolioOpenOrderChildMobileCard,
  PortfolioOpenOrderDataCells,
  PortfolioOpenOrderSingleMarketCell
} from "@/views/portfolio/portfolio-open-order-rows";
import { PortfolioTableMobileField } from "@/views/portfolio/portfolio-table-mobile";
import {
  portfolioActionButtonClass,
  portfolioOrdersTableRowClass,
  portfolioTableMobileCardClass
} from "@/views/portfolio/portfolio-ui";
import type { UserOpenOrder } from "@/lib/portfolio/types";

export type PortfolioOpenOrderMarketCardProps = {
  group: OpenOrderMarketGroup;
  marketContextMap: Record<string, OpenOrderMarketContext>;
  layout: "desktop" | "mobile";
  defaultExpanded?: boolean;
  className?: string;
};

export function PortfolioOpenOrderMarketCard({
  group,
  marketContextMap,
  layout,
  defaultExpanded = false,
  className
}: PortfolioOpenOrderMarketCardProps) {
  const t = useTranslations("portfolio");
  const locale = useLocale();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [cancelAllOpen, setCancelAllOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<{
    order: UserOpenOrder;
    marketTitle: string;
  } | null>(null);
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
    {
      marketKind: marketContext?.marketKind,
      contextSlug: marketContext?.slug,
      teams
    }
  );
  const marketIcon = useMemo(() => {
    const firstOrder = group.orders[0];

    if (!firstOrder) {
      return undefined;
    }

    return resolvePortfolioMarketIcon(teams, firstOrder.outcome, {
      contextIcon: marketContext?.icon,
      marketKind: marketContext?.marketKind
    });
  }, [group.orders, marketContext?.icon, marketContext?.marketKind, teams]);

  const orderCount = group.orders.length;
  const isSingleOrder = orderCount === 1;
  const singleOrder = group.orders[0];

  if (!singleOrder && orderCount === 0) {
    return null;
  }

  const handleCancelOrder = (order: UserOpenOrder) => {
    setCancelTarget({ order, marketTitle });
  };

  if (layout === "desktop") {
    if (isSingleOrder && singleOrder) {
      return (
        <>
          <div className={cn(portfolioOrdersTableRowClass, className)} role="row">
            <div role="cell" className="min-w-0">
              <PortfolioOpenOrderSingleMarketCell
                title={marketTitle}
                href={tradeHref}
                icon={marketIcon}
                order={singleOrder}
              />
            </div>
            <PortfolioOpenOrderDataCells order={singleOrder} />
            <PortfolioOpenOrderCancelButton
              regionRestricted={regionRestricted}
              onCancel={() => handleCancelOrder(singleOrder)}
            />
          </div>
          {cancelTarget ? (
            <PortfolioOpenOrderCancelDialog
              open
              order={cancelTarget.order}
              marketTitle={cancelTarget.marketTitle}
              onClose={() => setCancelTarget(null)}
            />
          ) : null}
        </>
      );
    }

    return (
      <>
        <div className={cn(portfolioOrdersTableRowClass, className)} role="row">
          <div role="cell" className="min-w-0">
            <PortfolioMarketCell
              title={marketTitle}
              href={tradeHref}
              outcome=""
              icon={marketIcon}
            />
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
              aria-label={
                expanded ? t("collapseMarketOrders") : t("expandMarketOrders")
              }
              className="mt-0.5 inline-flex items-center gap-1 text-left"
            >
              <span className="font-[Sora] text-xs font-normal text-[#909090]">
                {t("orderCount", { count: orderCount })}
              </span>
              <ChevronDown
                className={cn(
                  "size-3.5 shrink-0 text-[#909090] transition-transform duration-200",
                  expanded && "rotate-180"
                )}
                aria-hidden
              />
            </button>
          </div>
          <span role="cell" className="text-prophet-muted">
            —
          </span>
          <span role="cell" className="text-prophet-muted">
            —
          </span>
          <span role="cell" className="text-prophet-muted">
            —
          </span>
          <RegionRestrictedControl restricted={regionRestricted}>
            <button
              type="button"
              role="cell"
              className={cn(
                portfolioActionButtonClass,
                "justify-self-end whitespace-nowrap",
                "disabled:opacity-50"
              )}
              disabled={regionRestricted}
              onClick={() => {
                if (!regionRestricted) {
                  setCancelAllOpen(true);
                }
              }}
            >
              {t("cancelAll")}
            </button>
          </RegionRestrictedControl>
        </div>

        {expanded
          ? group.orders.map((order) => (
              <PortfolioOpenOrderChildDesktopRow
                key={order.id}
                order={order}
                regionRestricted={regionRestricted}
                onCancel={() => handleCancelOrder(order)}
              />
            ))
          : null}

        {cancelTarget ? (
          <PortfolioOpenOrderCancelDialog
            open
            order={cancelTarget.order}
            marketTitle={cancelTarget.marketTitle}
            onClose={() => setCancelTarget(null)}
          />
        ) : null}

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

  if (isSingleOrder && singleOrder) {
    return (
      <>
        <article className={cn(portfolioTableMobileCardClass, className)}>
          <PortfolioOpenOrderSingleMarketCell
            title={marketTitle}
            href={tradeHref}
            icon={marketIcon}
            order={singleOrder}
          />
          <PortfolioTableMobileField label={t("filled")}>
            {formatOpenOrderFilled(singleOrder)}
          </PortfolioTableMobileField>
          <PortfolioTableMobileField label={t("total")}>
            {formatOpenOrderTotal(singleOrder)}
          </PortfolioTableMobileField>
          <PortfolioTableMobileField
            label={t("expiration")}
            valueClassName="font-normal text-prophet-muted"
          >
            {formatOpenOrderExpiration(singleOrder, t, locale)}
          </PortfolioTableMobileField>
          <PortfolioOpenOrderCancelButton
            regionRestricted={regionRestricted}
            onCancel={() => handleCancelOrder(singleOrder)}
            className="w-full"
          />
        </article>
        {cancelTarget ? (
          <PortfolioOpenOrderCancelDialog
            open
            order={cancelTarget.order}
            marketTitle={cancelTarget.marketTitle}
            onClose={() => setCancelTarget(null)}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <article className={cn(portfolioTableMobileCardClass, className)}>
        <PortfolioMarketCell
          title={marketTitle}
          href={tradeHref}
          outcome=""
          icon={marketIcon}
        />
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-label={
            expanded ? t("collapseMarketOrders") : t("expandMarketOrders")
          }
          className="inline-flex items-center gap-1 text-left"
        >
          <span className="font-[Sora] text-xs font-normal text-[#909090]">
            {t("orderCount", { count: orderCount })}
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-[#909090] transition-transform duration-200",
              expanded && "rotate-180"
            )}
            aria-hidden
          />
        </button>
        <PortfolioTableMobileField label={t("filled")} valueClassName="text-prophet-muted">
          —
        </PortfolioTableMobileField>
        <PortfolioTableMobileField label={t("total")} valueClassName="text-prophet-muted">
          —
        </PortfolioTableMobileField>
        <PortfolioTableMobileField
          label={t("expiration")}
          valueClassName="font-normal text-prophet-muted"
        >
          —
        </PortfolioTableMobileField>
        <RegionRestrictedControl restricted={regionRestricted}>
          <button
            type="button"
            className={cn(
              portfolioActionButtonClass,
              "w-full",
              "disabled:opacity-50"
            )}
            disabled={regionRestricted}
            onClick={() => {
              if (!regionRestricted) {
                setCancelAllOpen(true);
              }
            }}
          >
            {t("cancelAll")}
          </button>
        </RegionRestrictedControl>
      </article>

      {expanded
        ? group.orders.map((order) => (
            <PortfolioOpenOrderChildMobileCard
              key={`${order.id}-mobile`}
              order={order}
              regionRestricted={regionRestricted}
              onCancel={() => handleCancelOrder(order)}
            />
          ))
        : null}

      {cancelTarget ? (
        <PortfolioOpenOrderCancelDialog
          open
          order={cancelTarget.order}
          marketTitle={cancelTarget.marketTitle}
          onClose={() => setCancelTarget(null)}
        />
      ) : null}

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
