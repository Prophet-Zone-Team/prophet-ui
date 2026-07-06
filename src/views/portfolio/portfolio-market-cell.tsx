"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import {
  formatSharePrice,
  getOutcomeToneClass
} from "@/lib/portfolio/portfolio-format";
import type { PortfolioMarketIcon } from "@/lib/portfolio/teams-condition";

import { PortfolioMarketIconView } from "./portfolio-market-icon";

export interface PortfolioMarketCellProps {
  title: string;
  href?: string;
  outcome: string;
  price?: number;
  /** @deprecated Prefer `price` so cents formatting stays consistent. */
  priceLabel?: string;
  shares?: number;
  icon?: PortfolioMarketIcon;
}

export function PortfolioMarketCell({
  title,
  href,
  outcome,
  price,
  priceLabel,
  shares,
  icon = { kind: "placeholder" }
}: PortfolioMarketCellProps) {
  const t = useTranslations("portfolio");
  const formattedPrice =
    price != null && Number.isFinite(price)
      ? formatSharePrice(price)
      : priceLabel;
  const subline = formattedPrice ? `${outcome} ${formattedPrice}` : outcome;
  const sharesLabel =
    shares != null && Number.isFinite(shares)
      ? t("sharesCount", { count: shares.toFixed(1) })
      : null;

  return (
    <div className="flex min-w-0 items-start gap-2">
      <PortfolioMarketIconView icon={icon} />
      <div className="min-w-0 overflow-hidden text-ellipsis">
        {href ? (
          <a
            href={href}
            className="m-0 truncate font-[500] text-prophet-foreground hover:underline"
          >
            {title}
          </a>
        ) : (
          <p className="m-0 truncate font-[500] text-prophet-foreground">{title}</p>
        )}
        {outcome ? (
          <p className={cn("m-0 mt-0.5 text-xs", getOutcomeToneClass(outcome))}>
            {subline}
            {sharesLabel ? (
              <span className="text-prophet-muted ml-1"> {sharesLabel}</span>
            ) : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}
