"use client";

import { ChevronDown, ChevronLeft, RotateCcw, X } from "lucide-react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import {
  isValidPriceInput,
  isValidSlippageInput,
  isValidUsdCapInput
} from "@/lib/copy-trade/transforms";

import { CopyTradeInfoTooltip } from "./info-tooltip";
import type { WalletCopyAdvancedFields, WalletCopyFormValues } from "./types";

export interface WalletCopyAdvancedSettingsModalProps {
  open: boolean;
  draft: WalletCopyAdvancedFields;
  savedAdvanced: WalletCopyAdvancedFields;
  onDraftChange: (patch: Partial<WalletCopyAdvancedFields>) => void;
  onSave: () => void;
  onClose: () => void;
  onClear: () => void;
}

export function WalletCopyAdvancedSettingsModal({
  open,
  draft,
  savedAdvanced,
  onDraftChange,
  onSave,
  onClose,
  onClear
}: WalletCopyAdvancedSettingsModalProps) {
  const t = useTranslations("copyTrade.walletCopy");
  const tCommon = useTranslations("copyTrade.common");
  const tRootCommon = useTranslations("common");

  const fieldErrors = useMemo(
    () => ({
      maxUsdPerTrade: !isValidUsdCapInput(draft.maxUsdPerTrade),
      maxUsdPerMarket: !isValidUsdCapInput(draft.maxUsdPerMarket),
      maxUsdPerHour: !isValidUsdCapInput(draft.maxUsdPerHour),
      maxUsdTotal: !isValidUsdCapInput(draft.maxUsdTotal),
      minPrice: !isValidPriceInput(draft.minPrice),
      maxPrice: !isValidPriceInput(draft.maxPrice),
      maxSlippage: !isValidSlippageInput(draft.maxSlippage)
    }),
    [draft]
  );

  const hasFieldErrors = useMemo(
    () => Object.values(fieldErrors).some(Boolean),
    [fieldErrors]
  );

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(savedAdvanced),
    [draft, savedAdvanced]
  );

  const orderTypeOptions = useMemo(
    () => [
      { value: "FAK" as const, label: t("orderTypeFak") },
      { value: "FOK" as const, label: t("orderTypeFok") }
    ],
    [t]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={t("advancedSettingsAriaLabel")}
      hideCloseButton
      overlayClassName="z-[70]"
      className={cn(
        "w-full max-w-[500px] rounded-[20px] border border-[#EBEBEB] bg-white",
        "p-5 shadow-[0px_0px_10px_rgba(0,0,0,0.1)]"
      )}
    >
      <div className="flex flex-col gap-5">
        <header className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-5 shrink-0 items-center justify-center border-0 bg-transparent p-0 text-[#909090] transition-colors hover:text-black"
              aria-label={t("backToCopySettings")}
            >
              <ChevronLeft className="size-4" strokeWidth={1.6} aria-hidden="true" />
            </button>
            <h2 className="text-base font-medium leading-5 text-black">
              {t("advancedSetting")}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 border-0 bg-transparent p-0 text-sm leading-[18px] text-[#3168FF] transition-opacity hover:opacity-80"
            >
              {t("clearAdvanced")}
              <RotateCcw className="size-3" strokeWidth={1.6} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-[10px] items-center justify-center border-0 bg-transparent p-0 text-[#909090] transition-colors hover:text-black"
              aria-label={tRootCommon("close")}
            >
              <X className="size-[10px]" strokeWidth={1.6} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-3">
          <div>
            <ToggleRow
              label={t("buyTakerOnly")}
              checked={draft.buyTakerOnly}
              onCheckedChange={(checked) =>
                onDraftChange({ buyTakerOnly: checked })
              }
              tooltip={t("buyTakerOnlyTooltip")}
            />
            <ToggleRow
              label={t("sellTakerOnly")}
              checked={draft.sellTakerOnly}
              onCheckedChange={(checked) =>
                onDraftChange({ sellTakerOnly: checked })
              }
              tooltip={t("sellTakerOnlyTooltip")}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <CapInput
              label={t("singleOrderCap")}
              value={draft.maxUsdPerTrade}
              hint="≥$5"
              prefix="$"
              invalid={fieldErrors.maxUsdPerTrade}
              onChange={(value) => onDraftChange({ maxUsdPerTrade: value })}
            />
            <CapInput
              label={t("perMarketCap")}
              value={draft.maxUsdPerMarket}
              hint="≥$5"
              prefix="$"
              invalid={fieldErrors.maxUsdPerMarket}
              onChange={(value) => onDraftChange({ maxUsdPerMarket: value })}
            />
            <CapInput
              label={t("hourlyCap")}
              value={draft.maxUsdPerHour}
              hint="≥$5"
              prefix="$"
              invalid={fieldErrors.maxUsdPerHour}
              onChange={(value) => onDraftChange({ maxUsdPerHour: value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <CapInput
              label={t("totalCap")}
              value={draft.maxUsdTotal}
              hint="≥$5"
              prefix="$"
              invalid={fieldErrors.maxUsdTotal}
              onChange={(value) => onDraftChange({ maxUsdTotal: value })}
            />
            <CapInput
              label={t("minPrice")}
              value={draft.minPrice}
              hint="0≤x<1"
              invalid={fieldErrors.minPrice}
              onChange={(value) => onDraftChange({ minPrice: value })}
            />
            <CapInput
              label={t("maxPrice")}
              value={draft.maxPrice}
              hint="0<x<1"
              invalid={fieldErrors.maxPrice}
              onChange={(value) => onDraftChange({ maxPrice: value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <CapInput
              label={t("maxSlippage")}
              value={draft.maxSlippage}
              hint="<0.5"
              invalid={fieldErrors.maxSlippage}
              onChange={(value) => onDraftChange({ maxSlippage: value })}
            />
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="text-sm leading-[18px] text-[#909090]">
                {t("orderType")}
              </span>
              <div className="relative">
                <select
                  value={draft.orderType}
                  onChange={(event) =>
                    onDraftChange({
                      orderType: event.target
                        .value as WalletCopyFormValues["orderType"]
                    })
                  }
                  className={cn(
                    "h-9 w-full appearance-none rounded-lg border border-[#EBEBEB] bg-white",
                    "px-3 pr-8 text-sm leading-[18px] text-black outline-none",
                    "focus:border-[#909090]"
                  )}
                  aria-label={t("ariaOrderType")}
                >
                  {orderTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#909090]"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={cn(
            "flex h-[50px] w-full items-center justify-center rounded-lg bg-black",
            "text-base leading-5 text-white transition-opacity hover:opacity-90",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          disabled={hasFieldErrors || !isDirty}
          onClick={onSave}
        >
          {tCommon("save")}
        </button>
      </div>
    </Modal>
  );
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
  tooltip
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  tooltip: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="text-sm leading-[18px] text-[#909090]">{label}</span>
        <CopyTradeInfoTooltip content={tooltip} />
      </div>
      <CopyTradeToggle
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
    </div>
  );
}

function CopyTradeToggle({
  checked,
  onCheckedChange,
  "aria-label": ariaLabel
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  "aria-label": string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-5 w-[36px] shrink-0 rounded-[10px] border transition-colors",
        checked ? "border-black bg-black" : "border-[#EAEAEA] bg-[#EBEBEB]"
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 size-4 -translate-y-1/2 rounded-lg border border-[#EAEAEA] bg-white transition-[left]",
          checked ? "left-[calc(100%-17px)]" : "left-0.5"
        )}
        aria-hidden="true"
      />
    </button>
  );
}

function CapInput({
  label,
  value,
  hint,
  prefix,
  invalid = false,
  onChange,
  className
}: {
  label: string;
  value: string;
  hint: string;
  prefix?: string;
  invalid?: boolean;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <span className="text-sm leading-[18px] text-[#909090]">{label}</span>
      <div
        className={cn(
          "relative flex h-9 items-center rounded-lg border bg-white px-3",
          invalid ? "border-[#FF674B]" : "border-[#EBEBEB]"
        )}
      >
        <input
          type="text"
          inputMode="decimal"
          value={prefix ? `${prefix}${value}` : value}
          onChange={(event) => {
            const raw = event.target.value;
            const next = prefix ? raw.replace(/^\$/, "") : raw;
            onChange(next);
          }}
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm leading-[18px] text-black outline-none"
          aria-label={label}
          aria-invalid={invalid}
        />
        <span
          className={cn(
            "shrink-0 pl-2 text-xs leading-[15px]",
            invalid ? "text-[#FF674B]" : "text-[#909090]"
          )}
        >
          {hint}
        </span>
      </div>
    </div>
  );
}
