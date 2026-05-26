"use client";

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
import type { TeamMarketSnapshot } from "@/types/market";
import { TeamFlag } from "@/components/teams/team-flag";
import {
  FundingModalShell,
  fundingPrimaryButtonClass
} from "@/views/portfolio/shared/funding-modal-shell";
import { usePortfolioContext } from "@/views/portfolio/context";
import { PORTFOLIO_SELL_MODAL_WIDTH } from "@/views/portfolio/portfolio-position-sell-dialog";
import { portfolioSecondaryButtonClass } from "@/views/portfolio/portfolio-ui";
import { useCancelOpenOrder } from "@/views/portfolio/use-cancel-open-order";

export interface PortfolioOpenOrderCancelDialogProps {
  open: boolean;
  order: UserOpenOrder;
  snapshot?: TeamMarketSnapshot;
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
  snapshot,
  onClose
}: PortfolioOpenOrderCancelDialogProps) {
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
  const marketLabel = order.outcome || order.market || order.asset_id;
  const isBusy = isCanceling(order.id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={`Cancel order for ${marketLabel}`}
      className={PORTFOLIO_SELL_MODAL_WIDTH}
      hideCloseButton
    >
      <FundingModalShell title="Cancel order" onClose={onClose}>
        <div className="flex flex-col gap-5 pb-2">
          <div className="flex items-start gap-2.5">
            {snapshot ? (
              <TeamFlag code={snapshot.team.code} name={snapshot.team.name} />
            ) : (
              <span
                className="flex size-5 shrink-0 items-center justify-center rounded-full bg-prophet-line text-[10px] text-prophet-muted"
                aria-hidden="true"
              >
                ?
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="m-0 line-clamp-2 text-sm font-[556] leading-[17px] text-black">
                {marketLabel}
              </p>
              <p
                className={cn(
                  "m-0 mt-1 text-xs font-[556]",
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
              <span className="text-sm font-[556] text-prophet-muted">
                Remaining size
              </span>
              <span className="text-sm font-[556] text-black">
                {formatShareSize(getRemainingSize(order))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-[556] text-prophet-muted">Filled</span>
              <span className="text-sm font-[556] text-black">
                {getFilledPercent(order)}
              </span>
            </div>
          </div>

          <p className="m-0 text-sm text-prophet-muted">
            This will remove the open order from the book. Any filled portion will
            remain in your account.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 pb-4">
          <button
            type="button"
            className={portfolioSecondaryButtonClass}
            disabled={isBusy}
            onClick={onClose}
          >
            Keep order
          </button>
          <RegionRestrictedControl restricted={isRegionBlocked}>
            <button
              type="button"
              className={fundingPrimaryButtonClass}
              disabled={isBusy || isRegionBlocked}
              onClick={() => void cancelOpenOrder(order)}
            >
              {isBusy ? "Cancelling…" : "Cancel order"}
            </button>
          </RegionRestrictedControl>
        </div>
      </FundingModalShell>
    </Modal>
  );
}
