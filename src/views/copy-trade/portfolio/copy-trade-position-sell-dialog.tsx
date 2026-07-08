"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import {
  resolveCopySellMinShares,
  roundCopySellShares,
  validateCopySellAmount,
} from "@/lib/copy-trade/evaluate-copy-position-sell";
import {
  formatSharePrice,
  getOutcomeToneClass,
} from "@/lib/portfolio/portfolio-format";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import type { CopyTradeSellableBalance } from "@/types/copy-trade-api";
import type { UserPositionRecord } from "@/types/market";
import {
  FundingModalShell,
  fundingPrimaryButtonClass,
  fundingSecondaryButtonClass,
} from "@/views/portfolio/shared/funding-modal-shell";
import { FundingResponsiveOverlay } from "@/views/portfolio/shared/funding-responsive-overlay";
import {
  tradeQuickAmountClass,
  tradeQuickAmountSelectedClass,
} from "@/views/trade/trade-widget/trade-ui";

export interface CopyTradePositionSellConfirm {
  shares?: number;
  sellAll?: boolean;
}

export interface CopyTradePositionSellDialogProps {
  open: boolean;
  position: UserPositionRecord;
  sellable: CopyTradeSellableBalance | null;
  loadingBalance: boolean;
  selling: boolean;
  onClose: () => void;
  onConfirm: (request: CopyTradePositionSellConfirm) => void;
}

const SELL_QUICK_FRACTIONS = [
  { label: "25%", value: 0.25 as const },
  { label: "50%", value: 0.5 as const },
  { label: "75%", value: 0.75 as const },
  { label: "100%", value: "all" as const },
];

function formatShareAmount(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
}

export function CopyTradePositionSellDialog({
  open,
  position,
  sellable,
  loadingBalance,
  selling,
  onClose,
  onConfirm,
}: CopyTradePositionSellDialogProps) {
  const t = useTranslations("copyTrade.portfolio.sell");

  const balanceLoaded = sellable !== null;
  const maxShares = sellable?.shares ?? position.size;
  const minShares = resolveCopySellMinShares(sellable?.min_shares);
  const cashflowPending = sellable?.cashflow_pending ?? 0;

  const [shares, setShares] = useState(maxShares);
  const [sellAll, setSellAll] = useState(true);

  useEffect(() => {
    if (open) {
      setShares(maxShares);
      setSellAll(true);
    }
  }, [open, maxShares]);

  const selectedShares = sellAll ? maxShares : shares;

  const validation = useMemo(
    () =>
      validateCopySellAmount({
        maxShares,
        selectedShares,
        sellAll,
        minShares,
        cashflowPending,
      }),
    [cashflowPending, maxShares, minShares, selectedShares, sellAll]
  );

  const estProceeds = validation.submittedShares * position.curPrice;

  const warningMessage = useMemo(() => {
    switch (validation.reason) {
      case "reconciling":
        return t("reconciling", { count: cashflowPending });
      case "position_too_small":
        return t("positionTooSmall", { min: minShares });
      case "below_min":
        return t("belowMin", { min: minShares });
      case "over_max":
        return t("overMax", { max: formatShareAmount(maxShares) });
      case "will_clear_residual":
        return t("willClearResidual", {
          residual: formatShareAmount(validation.requestedResidual),
        });
      case "will_leave_dust":
        return t("willLeaveDust", {
          residual: formatShareAmount(validation.residualShares),
        });
      default:
        return null;
    }
  }, [
    cashflowPending,
    maxShares,
    minShares,
    t,
    validation.reason,
    validation.requestedResidual,
    validation.residualShares,
  ]);

  if (!open) {
    return null;
  }

  return (
    <FundingResponsiveOverlay
      open={open}
      onClose={onClose}
      ariaLabel={t("title")}
      overlayCloseable={!selling}
    >
      <FundingModalShell
        title={t("title")}
        onClose={onClose}
        className="w-full max-w-[492px]"
        footer={
          <div className="flex flex-col gap-3">
            <p className="m-0 text-center text-xs text-prophet-muted">
              {t("footerNote")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={fundingSecondaryButtonClass}
                disabled={selling}
                onClick={onClose}
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                className={cn(
                  fundingPrimaryButtonClass,
                  "bg-[#FF674B] text-white hover:opacity-90"
                )}
                disabled={selling || loadingBalance || !validation.valid}
                onClick={() =>
                  onConfirm(sellAll ? { sellAll: true } : { shares })
                }
              >
                {selling ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {t("selling")}
                  </span>
                ) : (
                  t("confirm")
                )}
              </button>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-4 px-5 pb-2">
          <div>
            <p className="m-0 line-clamp-2 text-sm font-[500] text-prophet-foreground">
              {position.title}
            </p>
            <p
              className={cn(
                "mt-1 text-xs font-[500]",
                getOutcomeToneClass(position.outcome)
              )}
            >
              {position.outcome}
            </p>
          </div>

          <p className="m-0 text-xs text-prophet-muted">
            {loadingBalance || !balanceLoaded
              ? t("loadingBalance")
              : t("sellableShares", {
                  shares: formatShareAmount(maxShares),
                })}{" "}
            ·{" "}
            {t("currentPrice", {
              price: formatSharePrice(position.curPrice),
            })}
          </p>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-prophet-muted">{t("sharesLabel")}</span>
            <input
              type="number"
              min={0}
              max={maxShares}
              step="0.000001"
              value={selectedShares}
              disabled={sellAll || loadingBalance}
              onChange={(event) => {
                setShares(Number(event.target.value));
                setSellAll(false);
              }}
              className="h-10 rounded-[8px] border border-prophet-line bg-prophet-panel px-3 text-sm text-prophet-foreground outline-none focus:border-prophet-muted disabled:opacity-50"
            />
            <span className="text-xs text-prophet-muted">
              {t("sharesHint", { shares: formatShareAmount(maxShares) })}
            </span>
          </label>

          <div className="flex flex-wrap gap-2">
            {SELL_QUICK_FRACTIONS.map((item) => {
              const isAll = item.value === "all";
              const isSelected = isAll
                ? sellAll
                : !sellAll &&
                  Math.abs(selectedShares - maxShares * item.value) < 1e-6;

              return (
                <button
                  key={item.label}
                  type="button"
                  disabled={loadingBalance || maxShares <= 0}
                  className={cn(
                    tradeQuickAmountClass,
                    isSelected && tradeQuickAmountSelectedClass
                  )}
                  onClick={() => {
                    if (isAll) {
                      setSellAll(true);
                      return;
                    }

                    setShares(roundCopySellShares(maxShares * item.value));
                    setSellAll(false);
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <dl className="space-y-1.5 rounded-[8px] border border-prophet-line bg-prophet-panel p-3 text-xs">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-prophet-muted">{t("estProceeds")}</dt>
              <dd className="font-[500] text-prophet-foreground">
                {formatTeamDetailMoney(estProceeds)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-prophet-muted">{t("submittedShares")}</dt>
              <dd className="font-[500] text-prophet-foreground">
                {formatShareAmount(validation.submittedShares)} shares
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-prophet-muted">{t("residualShares")}</dt>
              <dd className="font-[500] text-prophet-foreground">
                {formatShareAmount(validation.residualShares)} shares
              </dd>
            </div>
          </dl>

          {warningMessage ? (
            <p
              className={cn(
                "m-0 text-xs",
                validation.valid
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-prophet-red"
              )}
            >
              {warningMessage}
            </p>
          ) : null}
        </div>
      </FundingModalShell>
    </FundingResponsiveOverlay>
  );
}
