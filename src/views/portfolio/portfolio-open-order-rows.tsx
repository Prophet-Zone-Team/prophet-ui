"use client";

import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import {
  formatOpenOrderExpiration,
  formatOpenOrderFilled,
  formatOpenOrderPriceLabel,
  formatOpenOrderTotal
} from "@/lib/portfolio/open-order-format";
import { titleCase } from "@/lib/portfolio/portfolio-format";
import type { UserOpenOrder } from "@/lib/portfolio/types";
import type { PortfolioMarketIcon } from "@/lib/portfolio/teams-condition";
import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { PortfolioMarketCell } from "@/views/portfolio/portfolio-market-cell";
import {
  portfolioActionButtonClass,
  portfolioOrdersTableRowClass,
  portfolioTableMobileCardClass
} from "@/views/portfolio/portfolio-ui";
import { PortfolioTableMobileField } from "@/views/portfolio/portfolio-table-mobile";

type OutcomePillTone = "yes" | "no" | "neutral";

function resolveOutcomePillTone(outcome?: string): OutcomePillTone {
  const normalized = outcome?.toLowerCase().trim() ?? "";

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

export function PortfolioOpenOrderSidePriceCell({
  order,
  className
}: {
  order: UserOpenOrder;
  className?: string;
}) {
  const sideLabel = titleCase(order.side);
  const outcomeLabel = titleCase(order.outcome || "—");
  const priceLabel = formatOpenOrderPriceLabel(order);
  const pillTone = resolveOutcomePillTone(order.outcome);

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <span className="shrink-0 font-[500] text-prophet-muted">
        {sideLabel}
      </span>
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

export function PortfolioOpenOrderDataCells({
  order
}: {
  order: UserOpenOrder;
}) {
  const t = useTranslations("portfolio");
  const locale = useLocale();

  return (
    <>
      <span role="cell" className="font-[500] tabular-nums">
        {formatOpenOrderFilled(order)}
      </span>
      <span role="cell" className="font-[500] tabular-nums">
        {formatOpenOrderTotal(order)}
      </span>
      <span role="cell" className="text-prophet-muted">
        {formatOpenOrderExpiration(order, t, locale)}
      </span>
    </>
  );
}

export function PortfolioOpenOrderCancelButton({
  regionRestricted,
  onCancel,
  label,
  className
}: {
  regionRestricted: boolean;
  onCancel: () => void;
  label?: string;
  className?: string;
}) {
  const t = useTranslations("common");
  const cancelLabel = label ?? t("cancel");

  return (
    <RegionRestrictedControl restricted={regionRestricted}>
      <button
        type="button"
        role="cell"
        className={cn(
          portfolioActionButtonClass,
          "justify-self-end whitespace-nowrap",
          "disabled:opacity-50",
          className
        )}
        disabled={regionRestricted}
        onClick={() => {
          if (!regionRestricted) {
            onCancel();
          }
        }}
      >
        {cancelLabel}
      </button>
    </RegionRestrictedControl>
  );
}

export function PortfolioOpenOrderChildDesktopRow({
  order,
  regionRestricted,
  onCancel
}: {
  order: UserOpenOrder;
  regionRestricted: boolean;
  onCancel: () => void;
}) {
  return (
    <div
      className={cn(portfolioOrdersTableRowClass, "bg-[#FCFCFC]")}
      role="row"
    >
      <div role="cell" className="min-w-0 pl-7">
        <PortfolioOpenOrderSidePriceCell order={order} />
      </div>
      <PortfolioOpenOrderDataCells order={order} />
      <PortfolioOpenOrderCancelButton
        regionRestricted={regionRestricted}
        onCancel={onCancel}
      />
    </div>
  );
}

export function PortfolioOpenOrderChildMobileCard({
  order,
  regionRestricted,
  onCancel
}: {
  order: UserOpenOrder;
  regionRestricted: boolean;
  onCancel: () => void;
}) {
  const t = useTranslations("portfolio");
  const locale = useLocale();

  return (
    <article className={cn(portfolioTableMobileCardClass, "bg-[#FCFCFC] pl-6")}>
      <PortfolioTableMobileField label={t("market")}>
        <PortfolioOpenOrderSidePriceCell order={order} />
      </PortfolioTableMobileField>
      <PortfolioTableMobileField label={t("filled")}>
        {formatOpenOrderFilled(order)}
      </PortfolioTableMobileField>
      <PortfolioTableMobileField label={t("total")}>
        {formatOpenOrderTotal(order)}
      </PortfolioTableMobileField>
      <PortfolioTableMobileField
        label={t("expiration")}
        valueClassName="font-normal text-prophet-muted"
      >
        {formatOpenOrderExpiration(order, t, locale)}
      </PortfolioTableMobileField>
      <PortfolioOpenOrderCancelButton
        regionRestricted={regionRestricted}
        onCancel={onCancel}
        className="w-full"
      />
    </article>
  );
}

export function PortfolioOpenOrderSingleMarketCell({
  title,
  href,
  icon,
  order,
  className
}: {
  title: string;
  href?: string;
  icon?: PortfolioMarketIcon;
  order: UserOpenOrder;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <PortfolioMarketCell title={title} href={href} outcome="" icon={icon} />
      <PortfolioOpenOrderSidePriceCell order={order} className="mt-0.5 pl-7" />
    </div>
  );
}
