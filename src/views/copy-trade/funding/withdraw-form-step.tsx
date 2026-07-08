"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { formatNumber } from "@/utils";
import type { CopyWithdrawalAssetInfo } from "@/types/copy-trade-funding";
import { FundingSelectorDropdown } from "@/views/portfolio/shared/funding-selector-dropdown";
import { TokenIcon } from "@/views/portfolio/shared/token-icon";
import {
  withdrawAmountInputClass,
  withdrawFieldLabelClass,
  withdrawInputBoxClass,
  withdrawMaxButtonClass,
} from "@/views/portfolio/withdraw/withdraw-ui";
import { X } from "lucide-react";

export interface WithdrawFormStepProps {
  loading: boolean;
  allAssets: CopyWithdrawalAssetInfo[];
  selectedAsset: CopyWithdrawalAssetInfo | null;
  recipient: string;
  amount: string;
  maxAmount: number;
  blockReason: string;
  recipientError?: string;
  errorText?: string;
  onAssetChange: (asset: CopyWithdrawalAssetInfo) => void;
  onRecipientChange: (recipient: string) => void;
  onAmountChange: (amount: string) => void;
}

const assetRowClass = cn(
  "flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-prophet-action-panel",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

export function WithdrawFormStep({
  loading,
  allAssets,
  selectedAsset,
  recipient,
  amount,
  maxAmount,
  blockReason,
  recipientError,
  errorText,
  onAssetChange,
  onRecipientChange,
  onAmountChange,
}: WithdrawFormStepProps) {
  const t = useTranslations("copyTrade.funding.withdraw");
  const tWithdraw = useTranslations("portfolio.withdraw");
  const [assetOpen, setAssetOpen] = useState(false);

  const handleAmountChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      onAmountChange(value);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-2">
      {blockReason ? (
        <div className="rounded-[8px] border border-[#FF674B]/30 bg-[#FF674B]/10 px-4 py-3 text-sm text-[#FF674B]">
          {blockReason}
        </div>
      ) : null}

      <FundingSelectorDropdown
        label={t("asset")}
        triggerLabel={selectedAsset?.label ?? t("selectAsset")}
        open={assetOpen}
        onOpenChange={setAssetOpen}
        triggerIcon={
          selectedAsset ? (
            <TokenIcon
              symbol={selectedAsset.label}
              icon={selectedAsset.icon}
              size="sm"
            />
          ) : null
        }
        disabled={loading}
      >
        {allAssets.map((asset) => {
          const disabled = !asset.enabled || asset.status !== "supported";
          const isSelected = selectedAsset?.asset === asset.asset;

          return (
            <button
              key={asset.asset}
              type="button"
              role="option"
              aria-selected={isSelected}
              disabled={disabled}
              className={cn(assetRowClass, isSelected && "bg-prophet-hover")}
              onClick={() => {
                if (disabled) {
                  return;
                }
                onAssetChange(asset);
                setAssetOpen(false);
              }}
            >
              <span className="flex min-w-0 items-center gap-3">
                <TokenIcon
                  symbol={asset.label}
                  icon={asset.icon}
                  size="sm"
                />
                <span className="text-sm font-[500] text-prophet-foreground">
                  {asset.label}
                </span>
              </span>
              {disabled ? (
                <span className="text-xs text-prophet-muted">
                  {asset.reason || t("unavailable")}
                </span>
              ) : null}
            </button>
          );
        })}
      </FundingSelectorDropdown>

      <div className="flex flex-col gap-2">
        <span className={withdrawFieldLabelClass}>{t("recipientAddress")}</span>
        <div className={withdrawInputBoxClass}>
          <input
            className={withdrawAmountInputClass}
            placeholder={t("recipientPlaceholder")}
            value={recipient}
            spellCheck={false}
            autoComplete="off"
            onChange={(event) => onRecipientChange(event.target.value)}
          />
          {
            !!recipient && (
              <button
                type="button"
                className="absolute right-1.5 z-[1] flex size-5 items-center justify-center rounded-full bg-prophet-action-panel hover:bg-prophet-hover"
                onClick={() => onRecipientChange("")}
              >
                <X className="h-4 w-4 shrink-0" aria-hidden="true" />
              </button>
            )
          }
        </div>
        {recipientError ? (
          <span className="text-xs text-[#FF674B]">{recipientError}</span>
        ) : (
          <span className="text-xs text-prophet-muted">
            {t("fundsSentOnPolygon")}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className={withdrawFieldLabelClass}>{t("amountPusd")}</span>
          <span className="text-xs text-prophet-muted">
            {t("available", {
              amount: formatNumber(maxAmount, 2, true, { round: 0 }),
            })}
          </span>
        </div>
        <div className={withdrawInputBoxClass}>
          <input
            className={withdrawAmountInputClass}
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(event) => handleAmountChange(event.target.value)}
          />
          <button
            type="button"
            className={withdrawMaxButtonClass}
            disabled={maxAmount <= 0}
            onClick={() => onAmountChange(String(maxAmount))}
          >
            {tWithdraw("max")}
          </button>
        </div>
        {selectedAsset?.min_amount_pusd ? (
          <span className="text-xs text-prophet-muted">
            {t("minimumWithdrawal", {
              amount: formatNumber(selectedAsset.min_amount_pusd, 2, true),
            })}
          </span>
        ) : null}
        {errorText ? (
          <span className="text-xs text-[#FF674B]">{errorText}</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 rounded-[8px] border border-prophet-line bg-prophet-action-panel px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-prophet-muted">{t("asset")}</span>
          <span className="text-sm font-[500] text-prophet-foreground">
            {selectedAsset?.label ?? "—"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-prophet-muted">{t("network")}</span>
          <span className="text-sm font-[500] text-prophet-foreground">{t("polygon")}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-prophet-muted">{t("youReceive")}</span>
          <span className="text-sm font-[500] text-prophet-foreground">
            {amount ? `${formatNumber(Number(amount), 2, true, { round: 0 })}` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
