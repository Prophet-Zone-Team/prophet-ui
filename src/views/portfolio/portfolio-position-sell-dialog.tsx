"use client";

import { useRouter } from "next/navigation";
import { useCallback, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Modal } from "@/components/ui/modal";
import { TradeAuthActionButton } from "@/components/trading/trade-auth-action-button";
import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import type { PositionGameSellContext } from "@/lib/portfolio/resolve-position-game-sell-context";
import {
  formatSharePrice,
  getOutcomeToneClass
} from "@/lib/portfolio/portfolio-format";
import { derivePositionSellReceiveAmount } from "@/lib/portfolio/portfolio-metrics";
import { resolveTradeHref } from "@/lib/routes/trade";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import type { TeamMarketSnapshot, UserPositionRecord } from "@/types/market";
import {
  FundingModalShell,
  fundingPrimaryButtonClass
} from "@/views/portfolio/shared/funding-modal-shell";
import { usePortfolioContext } from "@/views/portfolio/context";
import { portfolioSecondaryButtonClass } from "@/views/portfolio/portfolio-ui";
import { useTradeTicket } from "@/views/trade/trade-widget/use-trade-ticket";
import {
  parseOrderAmount,
  resolveSelectedSellQuickAmount
} from "@/views/trade/trade-widget/trade-ticket-helpers";
import {
  tradeQuickAmountClass,
  tradeQuickAmountSelectedClass
} from "@/views/trade/trade-widget/trade-ui";

const SELL_QUICK_FRACTIONS = [
  { label: "25%", value: 0.25 as const },
  { label: "50%", value: 0.5 as const },
  { label: "75%", value: 0.75 as const },
  { label: "100%", value: "all" as const }
];

export const PORTFOLIO_SELL_MODAL_WIDTH = "w-[492px]";

export type PortfolioPositionSellDialogProps =
  | {
      open: boolean;
      variant: "team";
      position: UserPositionRecord;
      snapshot: TeamMarketSnapshot;
      onClose: () => void;
    }
  | {
      open: boolean;
      variant: "game";
      position: UserPositionRecord;
      context: PositionGameSellContext;
      onClose: () => void;
    };

interface PortfolioPositionSellSharedBodyProps {
  position: UserPositionRecord;
  headerIcon: ReactNode;
  onClose: () => void;
  ticket: ReturnType<typeof useTradeTicket> | null;
}

function PortfolioPositionSellSharedBody({
  position,
  headerIcon,
  onClose,
  ticket
}: PortfolioPositionSellSharedBodyProps) {
  const t = useTranslations("portfolio");
  const router = useRouter();

  if (!ticket) {
    return (
      <p className="py-8 text-center text-sm text-prophet-muted">
        {t("loadingOrderPreview")}
      </p>
    );
  }

  const { formProps } = ticket;
  const selectedShares = parseOrderAmount(formProps.amount);
  const liveSidePrice = formProps.preview.sidePrice;
  const receiveAmount = formatTeamDetailMoney(
    derivePositionSellReceiveAmount(
      position,
      selectedShares,
      liveSidePrice
    )
  );

  const sellQuickDisabled = formProps.availableShares <= 0;
  const selectedQuickAmount = resolveSelectedSellQuickAmount(
    formProps.availableShares,
    formProps.amount
  );
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
          {headerIcon}
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
              {position.outcome}{" "}
              {formatSharePrice(
                liveSidePrice > 0 ? liveSidePrice : position.curPrice
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-[500] text-black">{t("receiveToken")}</span>
            <span className="text-xl font-[500] text-black">
              {receiveAmount}
            </span>
          </div>
          <div className="flex justify-end gap-2">
            {SELL_QUICK_FRACTIONS.map(({ label, value }) => (
              <button
                key={label}
                type="button"
                aria-pressed={selectedQuickAmount === value}
                className={cn(
                  tradeQuickAmountClass,
                  selectedQuickAmount === value && tradeQuickAmountSelectedClass,
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
          {t("editOrder")}
        </button>
        <TradeAuthActionButton
          tradeSide="sell"
          className={fundingPrimaryButtonClass}
          actionLabel={t("cashOut", { amount: receiveAmount })}
          signingLabel={t("waitingForSignature")}
          submittingLabel={t("processing")}
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

function PortfolioPositionGameIcon({ position }: { position: UserPositionRecord }) {
  if (position.icon) {
    return (
      <img
        src={position.icon}
        alt=""
        className="h-5 w-5 shrink-0 rounded-[2px] object-cover"
      />
    );
  }

  return (
    <div
      className="h-5 w-5 shrink-0 rounded-[2px] bg-[#E8E8E8]"
      aria-hidden
    />
  );
}

function PortfolioPositionTeamSellBody({
  position,
  snapshot,
  onClose
}: {
  position: UserPositionRecord;
  snapshot: TeamMarketSnapshot;
  onClose: () => void;
}) {
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

  return (
    <PortfolioPositionSellSharedBody
      position={position}
      headerIcon={
        <TeamFlag code={snapshot.team.code} name={snapshot.team.name} />
      }
      onClose={onClose}
      ticket={ticket}
    />
  );
}

function PortfolioPositionGameSellBody({
  position,
  context,
  onClose
}: {
  position: UserPositionRecord;
  context: PositionGameSellContext;
  onClose: () => void;
}) {
  const { reload } = usePortfolioContext();

  const handleOrderSuccess = useCallback(async () => {
    onClose();
    reload();
  }, [onClose, reload]);

  const ticket = useTradeTicket({
    variant: "game",
    gameSnapshot: context.gameSnapshot,
    fixtureMarkets: context.fixtureMarkets,
    sellPosition: position,
    onOrderSuccess: handleOrderSuccess
  });

  return (
    <PortfolioPositionSellSharedBody
      position={position}
      headerIcon={<PortfolioPositionGameIcon position={position} />}
      onClose={onClose}
      ticket={ticket}
    />
  );
}

export function PortfolioPositionSellDialog(props: PortfolioPositionSellDialogProps) {
  const t = useTranslations("portfolio");
  const { open, position, onClose } = props;

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={t("sellAria", { title: position.title })}
      className={PORTFOLIO_SELL_MODAL_WIDTH}
      hideCloseButton
    >
      <FundingModalShell title={t("sellTitle")} onClose={onClose}>
        {props.variant === "team" ? (
          <PortfolioPositionTeamSellBody
            position={position}
            snapshot={props.snapshot}
            onClose={onClose}
          />
        ) : (
          <PortfolioPositionGameSellBody
            position={position}
            context={props.context}
            onClose={onClose}
          />
        )}
      </FundingModalShell>
    </Modal>
  );
}
