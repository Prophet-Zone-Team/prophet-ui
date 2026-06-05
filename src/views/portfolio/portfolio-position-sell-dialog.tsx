"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { Modal } from "@/components/ui/modal";
import { TradeAuthActionButton } from "@/components/trading/trade-auth-action-button";
import { cn } from "@/lib/cn";
import {
  formatSharePrice,
  getOutcomeToneClass
} from "@/lib/portfolio/portfolio-format";
import { derivePositionSellReceiveAmount } from "@/lib/portfolio/portfolio-metrics";
import { resolveTradeHref } from "@/lib/routes/trade";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import type { TeamMarketSnapshot, UserPositionRecord } from "@/types/market";
import { TeamFlag } from "@/components/teams/team-flag";
import {
  FundingModalShell,
  fundingPrimaryButtonClass
} from "@/views/portfolio/shared/funding-modal-shell";
import { usePortfolioContext } from "@/views/portfolio/context";
import { portfolioSecondaryButtonClass } from "@/views/portfolio/portfolio-ui";
import { useTradeTicket } from "@/views/trade/trade-widget/use-trade-ticket";
import { parseOrderAmount } from "@/views/trade/trade-widget/trade-ticket-helpers";
import { tradeQuickAmountClass } from "@/views/trade/trade-widget/trade-ui";

const SELL_QUICK_FRACTIONS = [
  { label: "25%", value: 0.25 as const },
  { label: "50%", value: 0.5 as const },
  { label: "75%", value: 0.75 as const },
  { label: "100%", value: "all" as const }
];

export const PORTFOLIO_SELL_MODAL_WIDTH = "w-[492px]";

export interface PortfolioPositionSellDialogProps {
  open: boolean;
  position: UserPositionRecord;
  snapshot: TeamMarketSnapshot;
  onClose: () => void;
}

interface PortfolioPositionSellBodyProps {
  position: UserPositionRecord;
  snapshot: TeamMarketSnapshot;
  onClose: () => void;
}

function PortfolioPositionSellBody({
  position,
  snapshot,
  onClose
}: PortfolioPositionSellBodyProps) {
  const router = useRouter();
  const { reload } = usePortfolioContext();

  const handleOrderSuccess = useCallback(async () => {
    onClose();
    reload();
  }, [onClose, reload]);

  const ticket = useTradeTicket({
    variant: "team",
    snapshot,
    sellPosition: position,
    onOrderSuccess: handleOrderSuccess
  });

  if (!ticket) {
    return (
      <p className="py-8 text-center text-sm text-prophet-muted">
        Loading order preview…
      </p>
    );
  }

  const { formProps } = ticket;
  const selectedShares = parseOrderAmount(formProps.amount);
  const receiveAmount = formatTeamDetailMoney(
    derivePositionSellReceiveAmount(position, selectedShares)
  );

  const sellQuickDisabled = position.size <= 0;
  const isBusy = formProps.actionInProgress;

  function handleEditOrder() {
    if (position.eventSlug || position.slug) {
      router.push(resolveTradeHref(position.eventSlug ?? position.slug));
    }

    onClose();
  }

  return (
    <>
      <div className="flex flex-col gap-5 pb-2">
        <div className="flex items-start gap-2.5">
          <TeamFlag code={snapshot.team.code} name={snapshot.team.name} />
          <div className="min-w-0 flex-1">
            <p className="m-0 line-clamp-2 text-sm font-[500] leading-[17px] text-black">
              {position.title}
            </p>
            <p
              className={cn(
                "m-0 mt-1 text-xs font-[500]",
                getOutcomeToneClass(position.outcome)
              )}
            >
              {position.outcome} {formatSharePrice(position.curPrice)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-[500] text-black">Receive Token</span>
            <span className="text-xl font-[500] text-black">
              {receiveAmount}
            </span>
          </div>
          <div className="flex justify-end gap-2">
            {SELL_QUICK_FRACTIONS.map(({ label, value }) => (
              <button
                key={label}
                type="button"
                className={cn(
                  tradeQuickAmountClass,
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
                disabled={sellQuickDisabled}
                onClick={() => formProps.onQuickAmount(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {formProps.message ? (
          <p
            className={cn(
              "m-0 text-sm",
              formProps.status === "error"
                ? "text-prophet-red"
                : "text-prophet-muted"
            )}
          >
            {formProps.message}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2 pb-4">
        <button
          type="button"
          className={portfolioSecondaryButtonClass}
          disabled={isBusy}
          onClick={handleEditOrder}
        >
          Edit order
        </button>
        <TradeAuthActionButton
          tradeSide="sell"
          className={fundingPrimaryButtonClass}
          actionLabel={`Cash out ${receiveAmount}`}
          signingLabel="Waiting for signature…"
          submittingLabel="Processing…"
          canSubmit={formProps.canSubmit}
          actionStatus={
            formProps.status === "signing"
              ? "signing"
              : formProps.status === "submitting"
                ? "submitting"
                : undefined
          }
          onAction={formProps.onSubmit}
          onLoginStart={formProps.onLoginStart}
          onLoginSuccess={formProps.onLoginSuccess}
          onLoginError={formProps.onLoginError}
        />
      </div>
    </>
  );
}

export function PortfolioPositionSellDialog({
  open,
  position,
  snapshot,
  onClose
}: PortfolioPositionSellDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={`Sell ${position.title}`}
      className={PORTFOLIO_SELL_MODAL_WIDTH}
      hideCloseButton
    >
      <FundingModalShell title="Sell" onClose={onClose}>
        <PortfolioPositionSellBody
          position={position}
          snapshot={snapshot}
          onClose={onClose}
        />
      </FundingModalShell>
    </Modal>
  );
}
