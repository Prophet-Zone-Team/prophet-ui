"use client";

import { useState } from "react";

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
  "flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-[#FAFBFC]",
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
  const [assetOpen, setAssetOpen] = useState(false);

  const handleAmountChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      onAmountChange(value);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-2">
      {blockReason ? (
        <div className="rounded-[8px] border border-[#F5C2C2] bg-[#FDECEC] px-4 py-3 text-sm text-[#B42318]">
          {blockReason}
        </div>
      ) : null}

      <FundingSelectorDropdown
        label="Asset"
        triggerLabel={selectedAsset?.label ?? "Select asset"}
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
              className={cn(assetRowClass, isSelected && "bg-[#F4F6FF]")}
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
                <span className="text-sm font-[500] text-black">
                  {asset.label}
                </span>
              </span>
              {disabled ? (
                <span className="text-xs text-[#909090]">
                  {asset.reason || "Unavailable"}
                </span>
              ) : null}
            </button>
          );
        })}
      </FundingSelectorDropdown>

      <div className="flex flex-col gap-2">
        <span className={withdrawFieldLabelClass}>Recipient address</span>
        <div className={withdrawInputBoxClass}>
          <input
            className={withdrawAmountInputClass}
            placeholder="0x…"
            value={recipient}
            spellCheck={false}
            autoComplete="off"
            onChange={(event) => onRecipientChange(event.target.value)}
          />
          {
            !!recipient && (
              <button
                type="button"
                className="absolute right-1.5 z-[1] size-5 rounded-full bg-[#F4F4F4] flex justify-center items-center hover:bg-[#E0E0E0]"
                onClick={() => onRecipientChange("")}
              >
                <X className="h-4 w-4 shrink-0" aria-hidden="true" />
              </button>
            )
          }
        </div>
        {recipientError ? (
          <span className="text-xs text-[#E5484D]">{recipientError}</span>
        ) : (
          <span className="text-xs text-[#909090]">
            Funds are sent on Polygon as the selected asset.
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className={withdrawFieldLabelClass}>Amount (pUSD)</span>
          <span className="text-xs text-[#909090]">
            Available: {formatNumber(maxAmount, 2, true, { round: 0 })}
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
            Max
          </button>
        </div>
        {selectedAsset?.min_amount_pusd ? (
          <span className="text-xs text-[#909090]">
            Minimum withdrawal: {formatNumber(selectedAsset.min_amount_pusd, 2, true)}{" "}
            pUSD
          </span>
        ) : null}
        {errorText ? (
          <span className="text-xs text-[#E5484D]">{errorText}</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 rounded-[8px] border border-[#EBEBEB] bg-[#FAFBFC] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#909090]">Asset</span>
          <span className="text-sm font-[500] text-black">
            {selectedAsset?.label ?? "—"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#909090]">Network</span>
          <span className="text-sm font-[500] text-black">Polygon</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#909090]">You receive</span>
          <span className="text-sm font-[500] text-black">
            {amount ? `${formatNumber(Number(amount), 2, true)}` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
