"use client";

import { useTranslations } from "next-intl";

import { Modal } from "@/components/ui/modal";
import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { useAuth } from "@/context/auth";
import { cn } from "@/lib/cn";
import { formatShareSize } from "@/lib/market/order-math";
import {
  formatSharePrice,
  getOutcomeToneClass,
  titleCase
} from "@/lib/portfolio/portfolio-format";
import type { UserOpenOrder } from "@/lib/portfolio/types";
import { TeamFlag } from "@/components/teams/team-flag";
import {
  FundingModalShell,
  fundingPrimaryButtonClass,
  fundingSecondaryButtonClass
} from "@/views/portfolio/shared/funding-modal-shell";
import { usePortfolioContext } from "@/views/portfolio/context";
import { PORTFOLIO_SELL_MODAL_WIDTH } from "@/views/portfolio/portfolio-position-sell-dialog";
import { useCancelOpenOrder } from "@/views/portfolio/use-cancel-open-order";

export interface PortfolioOpenOrderCancelDialogProps {
  open: boolean;
  order: UserOpenOrder;
  marketTitle?: string;
  teamName?: string;
  onClose: () => void;
}

function getRemainingSize(order: UserOpenOrder): number {
  const original = Number(order.original_size);
  const matched = Number(order.size_matched);

  if (!Number.isFinite(original)) {
    return 0;
  }

  return Math.max(0, original - (Number.isFinite(matched) ? matched : 0));
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

function getSideToneClass(side: string): string {
  const normalized = side.toLowerCase();

  if (normalized === "buy") {
    return "text-prophet-green";
  }

  if (normalized === "sell") {
    return "text-prophet-red";
  }

  return "text-prophet-muted";
}

export function PortfolioOpenOrderCancelDialog({
  open,
  order,
  marketTitle,
  teamName,
  onClose
}: PortfolioOpenOrderCancelDialogProps) {
  const t = useTranslations("portfolio");
  const { removeOpenOrder } = usePortfolioContext();
  const { isRegionBlocked } = useAuth();
  const { cancelOpenOrder, isCanceling } = useCancelOpenOrder({
    onOrderCancelled: (orderId) => {
      removeOpenOrder(orderId);
      onClose();
    }
  });

  const price = Number(order.price);
  const sideLabel = titleCase(order.side);
  const marketLabel =
    marketTitle?.trim() || order.outcome || order.market || order.asset_id;
  const isBusy = isCanceling(order.id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={t("cancelOrderFor", { market: marketLabel })}
      className={PORTFOLIO_SELL_MODAL_WIDTH}
      hideCloseButton
    >
      <FundingModalShell title={t("cancelOrder")} onClose={onClose}>
        <div className="flex flex-col gap-5 pb-2">
          <div className="flex items-start gap-2.5">
            {teamName ? (
              <TeamFlag name={teamName} />
            ) : (
              <span
                className="flex size-5 shrink-0 items-center justify-center rounded-full bg-prophet-line text-[10px] text-prophet-muted"
                aria-hidden="true"
              >
                ?
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="m-0 line-clamp-2 text-sm font-[500] leading-[17px] text-prophet-foreground">
                {marketLabel}
              </p>
              <p
                className={cn(
                  "m-0 mt-1 text-xs font-[500]",
                  order.outcome
                    ? getOutcomeToneClass(order.outcome)
                    : getSideToneClass(order.side)
                )}
              >
                {sideLabel}{" "}
                {Number.isFinite(price) ? formatSharePrice(price) : order.price}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-[500] text-prophet-muted">
                {t("remainingSize")}
              </span>
              <span className="text-sm font-[500] text-prophet-foreground">
                {formatShareSize(getRemainingSize(order))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-[500] text-prophet-muted">
                {t("filled")}
              </span>
              <span className="text-sm font-[500] text-prophet-foreground">
                {getFilledPercent(order)}
              </span>
            </div>
          </div>

          <p className="m-0 text-sm text-prophet-muted">
            {t("cancelOrderDescription")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 pb-4">
          <button
            type="button"
            className={fundingSecondaryButtonClass}
            disabled={isBusy}
            onClick={onClose}
          >
            {t("keepOrder")}
          </button>
          <RegionRestrictedControl restricted={isRegionBlocked}>
            <button
              type="button"
              className={fundingPrimaryButtonClass}
              disabled={isBusy || isRegionBlocked}
              onClick={() => void cancelOpenOrder(order)}
            >
              {isBusy ? t("cancelling") : t("cancelOrder")}
            </button>
          </RegionRestrictedControl>
        </div>
      </FundingModalShell>
    </Modal>
  );
}
