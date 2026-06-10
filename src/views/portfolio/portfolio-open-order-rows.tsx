"use client";

import { useState } from "react";

import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { useAuth } from "@/context/auth";
import { cn } from "@/lib/cn";
import { formatShareSize } from "@/lib/market/order-math";
import {
  formatSharePrice,
  formatUnixSeconds,
  titleCase
} from "@/lib/portfolio/portfolio-format";
import type { UserOpenOrder } from "@/lib/portfolio/types";
import { PortfolioOpenOrderCancelDialog } from "@/views/portfolio/portfolio-open-order-cancel-dialog";
import { PortfolioTableMobileField } from "@/views/portfolio/portfolio-table-mobile";
import {
  portfolioActionButtonClass,
  portfolioOpenOrderRowsHeadClass,
  portfolioOpenOrderRowsRowClass,
  portfolioTableMobileCardClass,
  portfolioTableMobileListClass
} from "@/views/portfolio/portfolio-ui";

type CancelTarget = {
  order: UserOpenOrder;
  marketTitle: string;
  teamName?: string;
};

export type PortfolioOpenOrderRowsProps = {
  orders: UserOpenOrder[];
  marketTitle: string;
  className?: string;
};

function getRemainingSize(order: UserOpenOrder): number {
  const original = Number(order.original_size);
  const matched = Number(order.size_matched);

  if (!Number.isFinite(original)) {
    return 0;
  }

  return Math.max(0, original - (Number.isFinite(matched) ? matched : 0));
}

type OutcomePillTone = "yes" | "no" | "neutral";

function resolveOutcomePillTone(outcome: string): OutcomePillTone {
  const normalized = outcome.toLowerCase().trim();

  if (normalized === "yes" || normalized === "draw") {
    return "yes";
  }

  if (normalized === "no") {
    return "no";
  }

  return "neutral";
}

function getOutcomePillClass(tone: OutcomePillTone): string {
  if (tone === "yes") {
    return "bg-[#f1fdf8] text-[#65AF14]";
  }

  if (tone === "no") {
    return "bg-[#fff4f6] text-[#FF674B]";
  }

  return "bg-[#f5f5f5] text-prophet-muted";
}

function formatOpenOrderPriceLabel(order: UserOpenOrder): string {
  const price = Number(order.price);

  return Number.isFinite(price) ? formatSharePrice(price) : order.price;
}

function PortfolioOpenOrderSidePriceCell({ order }: { order: UserOpenOrder }) {
  const sideLabel = titleCase(order.side);
  const outcomeLabel = titleCase(order.outcome || "—");
  const priceLabel = formatOpenOrderPriceLabel(order);
  const pillTone = resolveOutcomePillTone(order.outcome);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 font-[500] text-prophet-muted">{sideLabel}</span>
      <span
        className={cn(
          "inline-flex shrink-0 items-center rounded-full px-2 py-0.5",
          "text-xs font-[500] leading-[15px]",
          getOutcomePillClass(pillTone)
        )}
      >
        {outcomeLabel} {priceLabel}
      </span>
    </div>
  );
}

function getFilledPercent(order: UserOpenOrder): string {
  const original = Number(order.original_size);
  const matched = Number(order.size_matched);

  if (!Number.isFinite(original) || original <= 0) {
    return "0%";
  }

  const percent = ((Number.isFinite(matched) ? matched : 0) / original) * 100;
  return `${percent.toFixed(0)}%`;
}

export function PortfolioOpenOrderRows({
  orders,
  marketTitle,
  className
}: PortfolioOpenOrderRowsProps) {
  const [cancelTarget, setCancelTarget] = useState<CancelTarget | null>(null);
  const { isRegionBlocked } = useAuth();
  const regionRestricted = isRegionBlocked;

  if (orders.length === 0) {
    return null;
  }

  return (
    <>
      <div className={cn("bg-[#FCFCFC]", className)}>
        <div className="hidden min-w-[640px] md:block">
          <div className={portfolioOpenOrderRowsHeadClass} role="row">
            <span role="columnheader">Side / Price</span>
            <span role="columnheader">Size</span>
            <span role="columnheader">Filled</span>
            <span role="columnheader">Time</span>
            <span
              aria-hidden="true"
              className={cn(
                portfolioActionButtonClass,
                "invisible pointer-events-none justify-self-end"
              )}
            >
              Cancel
            </span>
          </div>

          {orders.map((order) => (
            <PortfolioOpenOrderRow
              key={order.id}
              order={order}
              regionRestricted={regionRestricted}
              onCancel={() =>
                setCancelTarget({
                  order,
                  marketTitle
                })
              }
            />
          ))}
        </div>

        <div className={portfolioTableMobileListClass}>
          {orders.map((order) => (
            <PortfolioOpenOrderMobileCard
              key={`${order.id}-mobile`}
              order={order}
              regionRestricted={regionRestricted}
              onCancel={() =>
                setCancelTarget({
                  order,
                  marketTitle
                })
              }
            />
          ))}
        </div>
      </div>

      {cancelTarget ? (
        <PortfolioOpenOrderCancelDialog
          open
          order={cancelTarget.order}
          marketTitle={cancelTarget.marketTitle}
          teamName={cancelTarget.teamName}
          onClose={() => setCancelTarget(null)}
        />
      ) : null}
    </>
  );
}

function PortfolioOpenOrderRow({
  order,
  regionRestricted,
  onCancel
}: {
  order: UserOpenOrder;
  regionRestricted: boolean;
  onCancel: () => void;
}) {
  return (
    <div className={portfolioOpenOrderRowsRowClass} role="row">
      <div role="cell" className="min-w-0">
        <PortfolioOpenOrderSidePriceCell order={order} />
      </div>
      <span role="cell">{formatShareSize(getRemainingSize(order))}</span>
      <span role="cell" className="text-prophet-muted">
        {getFilledPercent(order)}
      </span>
      <span role="cell" className="text-prophet-muted">
        {formatUnixSeconds(order.created_at)}
      </span>
      <RegionRestrictedControl restricted={regionRestricted}>
        <button
          type="button"
          role="cell"
          className={cn(
            portfolioActionButtonClass,
            "justify-self-end",
            "disabled:opacity-50"
          )}
          disabled={regionRestricted}
          onClick={() => {
            if (!regionRestricted) {
              onCancel();
            }
          }}
        >
          Cancel
        </button>
      </RegionRestrictedControl>
    </div>
  );
}

function PortfolioOpenOrderMobileCard({
  order,
  regionRestricted,
  onCancel
}: {
  order: UserOpenOrder;
  regionRestricted: boolean;
  onCancel: () => void;
}) {
  return (
    <article className={portfolioTableMobileCardClass}>
      <PortfolioTableMobileField label="Side / Price">
        <PortfolioOpenOrderSidePriceCell order={order} />
      </PortfolioTableMobileField>
      <PortfolioTableMobileField label="Size">
        {formatShareSize(getRemainingSize(order))}
      </PortfolioTableMobileField>
      <PortfolioTableMobileField
        label="Filled"
        valueClassName="font-normal text-prophet-muted"
      >
        {getFilledPercent(order)}
      </PortfolioTableMobileField>
      <PortfolioTableMobileField
        label="Time"
        valueClassName="font-normal text-prophet-muted"
      >
        {formatUnixSeconds(order.created_at)}
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
              onCancel();
            }
          }}
        >
          Cancel
        </button>
      </RegionRestrictedControl>
    </article>
  );
}
