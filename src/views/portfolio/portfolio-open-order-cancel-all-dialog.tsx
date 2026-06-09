"use client";

import { Modal } from "@/components/ui/modal";
import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { useAuth } from "@/context/auth";
import type { UserOpenOrder } from "@/lib/portfolio/types";
import {
  FundingModalShell,
  fundingPrimaryButtonClass
} from "@/views/portfolio/shared/funding-modal-shell";
import { usePortfolioContext } from "@/views/portfolio/context";
import { PORTFOLIO_SELL_MODAL_WIDTH } from "@/views/portfolio/portfolio-position-sell-dialog";
import { portfolioSecondaryButtonClass } from "@/views/portfolio/portfolio-ui";
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
  const { removeOpenOrders } = usePortfolioContext();
  const { isRegionBlocked } = useAuth();
  const { cancelMarketOrders, isCancelingMarket } = useCancelOpenOrder({
    onOrdersCancelled: (orderIds) => {
      removeOpenOrders(orderIds);
      onClose();
    }
  });

  const orderCount = orders.length;
  const orderLabel = orderCount === 1 ? "order" : "orders";
  const isBusy = isCancelingMarket(marketId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={`Cancel all orders for ${marketTitle}`}
      className={PORTFOLIO_SELL_MODAL_WIDTH}
      hideCloseButton
    >
      <FundingModalShell title="Cancel all orders" onClose={onClose}>
        <div className="flex flex-col gap-5 pb-2">
          <div className="min-w-0">
            <p className="m-0 line-clamp-2 text-sm font-[500] leading-[17px] text-black">
              {marketTitle}
            </p>
            <p className="m-0 mt-1 text-xs font-[500] text-prophet-muted">
              {orderCount} open {orderLabel}
            </p>
          </div>

          <p className="m-0 text-sm text-prophet-muted">
            This will cancel all open orders in this market. Any filled portion
            will remain in your account.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 pb-4">
          <button
            type="button"
            className={portfolioSecondaryButtonClass}
            disabled={isBusy}
            onClick={onClose}
          >
            Keep orders
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
              {isBusy ? "Cancelling…" : "Cancel all"}
            </button>
          </RegionRestrictedControl>
        </div>
      </FundingModalShell>
    </Modal>
  );
}
