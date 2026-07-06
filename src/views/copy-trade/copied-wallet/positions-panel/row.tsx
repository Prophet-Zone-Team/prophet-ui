"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { formatShortDateMinuteFromIso } from "@/lib/formatters/datetime";
import {
  formatPnlSubline,
  formatSharePrice
} from "@/lib/portfolio/portfolio-format";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import { copyTradeTableMobileCardClass } from "@/views/copy-trade/copy-trade-ui";
import { PortfolioTableMobileField } from "@/views/portfolio/portfolio-table-mobile";

import { copyWalletPositionsGridClass } from "./grid";
import { CopyWalletPositionMarketCell } from "./market-cell";
import type { CopyWalletPositionDisplay } from "./types";

export interface CopyWalletPositionRowProps {
  position: CopyWalletPositionDisplay;
  className?: string;
}

export function CopyWalletPositionRow({
  position,
  className
}: CopyWalletPositionRowProps) {
  const t = useTranslations("copyTrade.copiedWallet.positions");
  const pnlTone =
    position.cashPnl >= 0 ? "text-[#65AF14]" : "text-[#FF674B]";
  const timeLabel = formatShortDateMinuteFromIso(position.lastTradeAt) || "--";

  return (
    <>
      <div
        className={cn(
          copyWalletPositionsGridClass,
          "hidden border-t border-prophet-line px-4 py-3 md:grid",
          className
        )}
      >
        <CopyWalletPositionMarketCell
          title={position.title}
          outcome={position.outcome}
          priceLabel={formatSharePrice(position.avgPrice)}
          shares={position.shares}
          icon={position.icon}
        />
        <span className="text-[14px] leading-[18px] text-prophet-foreground tabular-nums">
          {formatSharePrice(position.avgPrice)}
        </span>
        <span className="text-[14px] leading-[18px] text-prophet-foreground tabular-nums">
          {formatSharePrice(position.currentPrice)}
        </span>
        <div className="flex flex-col items-start gap-0.5">
          <span className="text-[14px] leading-[18px] text-prophet-foreground tabular-nums">
            {formatTeamDetailMoney(position.currentValue)}
          </span>
          <span className={cn("text-[12px] leading-[15px] tabular-nums", pnlTone)}>
            {formatPnlSubline(position.cashPnl, position.percentPnl)}
          </span>
        </div>
        <span className="justify-self-end text-right text-[14px] leading-[18px] text-prophet-foreground tabular-nums">
          {timeLabel}
        </span>
      </div>

      <article
        className={cn(
          copyTradeTableMobileCardClass,
          "rounded-none border-0 border-t border-prophet-line py-3 md:hidden",
          className
        )}
      >
        <CopyWalletPositionMarketCell
          title={position.title}
          outcome={position.outcome}
          priceLabel={formatSharePrice(position.avgPrice)}
          shares={position.shares}
          icon={position.icon}
        />
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <PortfolioTableMobileField label={t("avg")}>
            {formatSharePrice(position.avgPrice)}
          </PortfolioTableMobileField>
          <PortfolioTableMobileField label={t("current")}>
            {formatSharePrice(position.currentPrice)}
          </PortfolioTableMobileField>
          <PortfolioTableMobileField label={t("value")}>
            <div className="flex flex-col items-end gap-0.5">
              <span>{formatTeamDetailMoney(position.currentValue)}</span>
              <span className={cn("text-xs font-normal", pnlTone)}>
                {formatPnlSubline(position.cashPnl, position.percentPnl)}
              </span>
            </div>
          </PortfolioTableMobileField>
          <PortfolioTableMobileField
            label={t("time")}
            valueClassName="font-normal text-prophet-muted"
          >
            {timeLabel}
          </PortfolioTableMobileField>
        </div>
      </article>
    </>
  );
}
