"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Modal } from "@/components/ui/modal";
import { TeamFlag } from "@/components/teams/team-flag";
import { useAuth } from "@/context/auth";
import { cn } from "@/lib/cn";
import {
  formatSharePrice,
  getOutcomeToneClass
} from "@/lib/portfolio/portfolio-format";
import { reportRedeemTransaction } from "@/lib/portfolio/user";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import { executeRedeem } from "@/lib/trading/deposit-wallet-redeem";
import type { UserPositionRecord } from "@/types/market";
import {
  FundingModalShell,
  fundingPrimaryButtonClass,
  fundingSecondaryButtonClass
} from "@/views/portfolio/shared/funding-modal-shell";
import { usePortfolioContext } from "@/views/portfolio/context";
import { PORTFOLIO_SELL_MODAL_WIDTH } from "@/views/portfolio/portfolio-position-sell-dialog";

export const PORTFOLIO_REDEEM_MODAL_WIDTH = PORTFOLIO_SELL_MODAL_WIDTH;

export interface PortfolioPositionRedeemDialogProps {
  open: boolean;
  position: UserPositionRecord;
  teamName?: string;
  onClose: () => void;
}

type RedeemPhase = "idle" | "signing" | "submitting" | "error";

export function PortfolioPositionRedeemDialog({
  open,
  position,
  teamName,
  onClose
}: PortfolioPositionRedeemDialogProps) {
  const t = useTranslations("portfolio");
  const tCommon = useTranslations("common");
  const { session, syncCash } = useAuth();
  const { reload } = usePortfolioContext();
  const [phase, setPhase] = useState<RedeemPhase>("idle");
  const [statusMessage, setStatusMessage] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();

  const resetState = useCallback(() => {
    setPhase("idle");
    setStatusMessage(undefined);
    setErrorMessage(undefined);
  }, []);

  useEffect(() => {
    if (open) {
      resetState();
    }
  }, [open, position.conditionId, resetState]);

  const handleClose = useCallback(() => {
    if (phase === "signing" || phase === "submitting") {
      return;
    }

    resetState();
    onClose();
  }, [onClose, phase, resetState]);

  const handleConfirm = async () => {
    if (!session?.walletAddress || !position.conditionId) {
      setErrorMessage(t("connectToRedeem"));
      setPhase("error");
      return;
    }

    setPhase("signing");
    setErrorMessage(undefined);
    setStatusMessage(t("preparingRedeemTransaction"));

    try {
      const { txHash } = await executeRedeem({
        walletAddress: session.walletAddress,
        conditionId: position.conditionId,
        onStatus: (message) => {
          setStatusMessage(message);
          if (/sign/i.test(message)) {
            setPhase("signing");
          } else if (/submit|pending|relayer/i.test(message)) {
            setPhase("submitting");
          }
        }
      });

      void reportRedeemTransaction({ position, teamName, txHash });

      try {
        await syncCash();
      } catch (syncError) {
        console.warn(
          "[portfolio-position-redeem-dialog] syncCash after redeem failed",
          syncError
        );
      }

      resetState();
      onClose();
      reload();
    } catch (error) {
      setPhase("error");
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const isBusy = phase === "signing" || phase === "submitting";
  const estimatedValue = formatTeamDetailMoney(position.currentValue);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      ariaLabel={t("redeemAria", { title: position.title })}
      className={PORTFOLIO_REDEEM_MODAL_WIDTH}
      hideCloseButton
    >
      <FundingModalShell title={t("redeemTitle")} onClose={handleClose}>
        <div className="flex flex-col gap-5 pb-2">
          <div className="flex items-start gap-2.5">
            {teamName ? <TeamFlag name={teamName} /> : null}
            <div className="min-w-0 flex-1">
              <p className="m-0 line-clamp-2 text-sm font-[500] leading-[17px] text-prophet-foreground">
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

          <div className="flex flex-col gap-1 rounded-lg border border-prophet-line/80 bg-prophet-base px-3 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-prophet-muted">{t("shares")}</span>
              <span className="font-[500] text-prophet-foreground">
                {formatTeamDetailMoney(position.size)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-prophet-muted">{t("estimatedOutcome")}</span>
              <span className="font-[500] text-prophet-foreground">{estimatedValue}</span>
            </div>
            <p className="m-0 text-xs text-prophet-muted">
              {t("redeemDescription")}
            </p>
          </div>

          {statusMessage ? (
            <p className="m-0 text-sm text-prophet-muted">{statusMessage}</p>
          ) : null}

          {errorMessage ? (
            <p className="m-0 text-sm text-prophet-red">{errorMessage}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 pb-4">
          <button
            type="button"
            className={fundingSecondaryButtonClass}
            disabled={isBusy}
            onClick={handleClose}
          >
            {tCommon("cancel")}
          </button>
          <button
            type="button"
            className={cn(
              fundingPrimaryButtonClass,
              "inline-flex items-center justify-center"
            )}
            disabled={isBusy}
            onClick={() => void handleConfirm()}
          >
            {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t("confirmRedeem")}
          </button>
        </div>
      </FundingModalShell>
    </Modal>
  );
}
