"use client";

import { useTranslations } from "next-intl";

import { Modal } from "@/components/ui/modal";
import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { useAuth } from "@/context/auth";
import type { UserOpenOrder } from "@/lib/portfolio/types";
import {
  FundingModalShell,
  fundingPrimaryButtonClass,
  fundingSecondaryButtonClass
} from "@/views/portfolio/shared/funding-modal-shell";
import { usePortfolioContext } from "@/views/portfolio/context";
import { PORTFOLIO_SELL_MODAL_WIDTH } from "@/views/portfolio/portfolio-position-sell-dialog";
import { useCancelOpenOrder } from "@/views/portfolio/use-cancel-open-order";

export interface PortfolioOpenOrderCancelAllDialogProps {
  open: boolean;
  marketId: string;
  marketTitle: string;
  orders: UserOpenOrder[];
  onClose: () => void;
}

export function PortfolioOpenOrderCancelAllDialog({
  open,
  marketId,
  marketTitle,
  orders,
  onClose
}: PortfolioOpenOrderCancelAllDialogProps) {
  const t = useTranslations("portfolio");
  const { removeOpenOrders } = usePortfolioContext();
  const { isRegionBlocked } = useAuth();
  const { cancelMarketOrders, isCancelingMarket } = useCancelOpenOrder({
    onOrdersCancelled: (orderIds) => {
      removeOpenOrders(orderIds);
      onClose();
    }
  });

  const orderCount = orders.length;
  const orderLabel = orderCount === 1 ? t("order") : t("orders");
  const isBusy = isCancelingMarket(marketId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={t("cancelAllOrdersFor", { market: marketTitle })}
      className={PORTFOLIO_SELL_MODAL_WIDTH}
      hideCloseButton
    >
      <FundingModalShell title={t("cancelAllOrders")} onClose={onClose}>
        <div className="flex flex-col gap-5 pb-2">
          <div className="min-w-0">
            <p className="m-0 line-clamp-2 text-sm font-[500] leading-[17px] text-black">
              {marketTitle}
            </p>
            <p className="m-0 mt-1 text-xs font-[500] text-prophet-muted">
              {t("openOrderCount", { count: orderCount, orderLabel })}
            </p>
          </div>

          <p className="m-0 text-sm text-prophet-muted">
            {t("cancelAllDescription")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 pb-4">
          <button
            type="button"
            className={fundingSecondaryButtonClass}
            disabled={isBusy}
            onClick={onClose}
          >
            {t("keepOrders")}
          </button>
          <RegionRestrictedControl restricted={isRegionBlocked}>
            <button
              type="button"
              className={fundingPrimaryButtonClass}
              disabled={isBusy || isRegionBlocked}
              onClick={() =>
                void cancelMarketOrders({
                  marketId,
                  marketTitle,
                  orders
                })
              }
            >
              {isBusy ? t("cancelling") : t("cancelAll")}
            </button>
          </RegionRestrictedControl>
        </div>
      </FundingModalShell>
    </Modal>
  );
}
