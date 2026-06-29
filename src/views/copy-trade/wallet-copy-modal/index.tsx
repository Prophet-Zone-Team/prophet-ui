"use client";

import { Check, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import {
  normalizeTargetForm,
  validateTargetForm,
  walletCopyFormToTargetForm,
  type CopyTargetForm
} from "@/lib/copy-trade/transforms";
import { formatCompactVolume } from "@/lib/formatters/volume";
import {
  resolveTraderRankDisplayStats,
  type CopyTradeRankTimeRange
} from "@/lib/copy-trade/trader-rank-filters";
import type { TraderCatalogEntry } from "@/types/copy-trade-api";

import { CopyTradeInfoTooltip } from "./info-tooltip";
import {
  COPY_TRADE_ORDER_TYPES,
  COPY_TRADE_RATIO_PRESETS,
  DEFAULT_WALLET_COPY_FORM,
  type WalletCopyFormValues,
  type WalletCopyTraderStats
} from "./types";

export interface WalletCopyModalProps {
  open: boolean;
  onClose: () => void;
  wallet: string;
  stats?: WalletCopyTraderStats;
  initialValues?: Partial<WalletCopyFormValues>;
  saving?: boolean;
  availableBalance?: number | null;
  isLoadingBalance?: boolean;
  canSubmitCopy?: boolean;
  balanceWarning?: string | null;
  onSubmit?: (form: CopyTargetForm) => void | Promise<void>;
}

export function buildWalletCopyStatsFromTrader(
  trader: TraderCatalogEntry,
  timeRange: CopyTradeRankTimeRange = "all"
): WalletCopyTraderStats {
  const displayStats = resolveTraderRankDisplayStats(trader, timeRange);
  const pnl = displayStats.pnl;
  const winRate = displayStats.winRate;

  let pnlPercent: string | null = null;
  if (pnl != null && pnl !== 0) {
    const volume = displayStats.volume;
    if (volume != null && volume > 0) {
      pnlPercent = `${((pnl / volume) * 100).toFixed(2)}%`;
    }
  }

  return {
    pnlPercent,
    pnlUsd:
      pnl != null ? `(${formatCompactVolume(Math.abs(pnl)) ?? "$0"})` : null,
    winRate:
      winRate != null
        ? `${(winRate > 0 && winRate <= 1 ? winRate * 100 : winRate).toFixed(1)}%`
        : null,
    lastTrade: null
  };
}

function formatPnlDisplay(stats?: WalletCopyTraderStats): string | null {
  if (!stats) {
    return null;
  }

  const parts = [stats.pnlPercent, stats.pnlUsd].filter(Boolean);
  if (parts.length === 0) {
    return null;
  }

  return parts.join(" ");
}

export function WalletCopyModal({
  open,
  onClose,
  wallet,
  stats,
  initialValues,
  saving = false,
  isLoadingBalance = false,
  canSubmitCopy = true,
  balanceWarning = null,
  onSubmit
}: WalletCopyModalProps) {
  const [form, setForm] = useState<WalletCopyFormValues>(() => ({
    ...DEFAULT_WALLET_COPY_FORM,
    ...initialValues
  }));
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<WalletCopyFormValues>(
    () => ({
      ...DEFAULT_WALLET_COPY_FORM,
      ...initialValues
    })
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextValues = {
      ...DEFAULT_WALLET_COPY_FORM,
      ...initialValues
    };
    setForm(nextValues);
    setSavedSnapshot(nextValues);
    setAdvancedOpen(false);
    setError("");
  }, [initialValues, open, wallet]);

  const patchForm = useCallback((patch: Partial<WalletCopyFormValues>) => {
    setError("");
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  const advancedDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedSnapshot),
    [form, savedSnapshot]
  );

  const handleSaveAdvanced = useCallback(() => {
    setSavedSnapshot(form);
  }, [form]);

  const handleSubmit = useCallback(() => {
    if (!canSubmitCopy) {
      setError(
        balanceWarning ??
          "Copy wallet balance is unavailable. Deposit funds before continuing."
      );
      return;
    }

    if (!form.buyEnabled && !form.sellEnabled) {
      setError("Enable copy buy or copy sell before continuing.");
      return;
    }

    const draft = walletCopyFormToTargetForm(wallet, form, {
      enabled: true,
      dryRun: false
    });
    const errors = validateTargetForm(draft);
    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }

    try {
      const normalized = normalizeTargetForm(draft);
      void onSubmit?.(normalized);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to validate copy settings."
      );
    }
  }, [balanceWarning, canSubmitCopy, form, onSubmit, wallet]);

  const pnlDisplay = formatPnlDisplay(stats);

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel="WalletCopy"
      className={cn(
        "w-full max-w-[500px] rounded-[20px] border border-[#EBEBEB] bg-white",
        "p-5 shadow-[0px_0px_10px_rgba(0,0,0,0.1)]"
      )}
      closeButtonClassName="right-5 top-5 border-0 bg-transparent text-[#909090] hover:bg-transparent hover:text-black"
    >
      <div className="flex flex-col gap-5">
        <header>
          <h2 className="text-xl font-medium leading-[25px] text-black">
            WalletCopy
          </h2>
        </header>

        <section className="flex flex-col gap-2">
          <p className="text-sm leading-[18px] text-black">Copy From</p>
          <div className="box-border flex h-[104px] flex-col rounded-lg border border-[#EBEBEB] bg-white px-2 py-3">
            <p className="truncate text-[14px] px-[8px] py-[11px] leading-[18px] text-black rounded-[6px] bg-[#F6F6F6]">
              {wallet}
            </p>
            <div className="mt-[10px] flex h-10 items-center px-2">
              <div className="grid h-full w-full grid-cols-3 items-center">
                <StatCell
                  label="PnL"
                  value={pnlDisplay ?? "—"}
                  valueClassName="text-[#65AF14]"
                />
                <StatCell
                  label="7D Win Rate"
                  value={stats?.winRate ?? "—"}
                  valueClassName="text-[#65AF14]"
                />
                <StatCell
                  label="Last Trade"
                  value={stats?.lastTrade ?? "—"}
                  valueClassName="text-[#65AF14]"
                  align="right"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <p className="text-sm leading-[18px] text-black">
              Copy Trade Ratio
            </p>
            <CopyTradeInfoTooltip
              content={
                <>
                  Buy Order Value = Target Filled Amount × Ratio; Sell Order
                  Quantity = Target Filled Volume × Ratio.
                </>
              }
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="relative h-2.5">
              <div className="absolute inset-0 rounded-md border border-[#EBEBEB] bg-[#EBEBEB]" />
              <div
                className="absolute inset-y-0 left-0 rounded-md bg-black"
                style={{ width: `${form.ratio}%` }}
              />
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={form.ratio}
                onChange={(event) =>
                  patchForm({ ratio: Number(event.target.value) })
                }
                className="absolute inset-0 z-[1] h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
                aria-label="Copy trade ratio"
              />
              <div
                className="pointer-events-none absolute top-1/2 size-[18px] -translate-y-1/2 rounded-full border border-[#909090] bg-black"
                style={{ left: `calc(${form.ratio}% - 9px)` }}
                aria-hidden="true"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {COPY_TRADE_RATIO_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={cn(
                      "inline-flex h-[30px] min-w-[50px] items-center justify-center rounded-lg border px-2",
                      "text-sm leading-[18px] transition-colors",
                      form.ratio === preset
                        ? "border-black bg-black text-white"
                        : "border-[#EBEBEB] bg-white text-[#909090] hover:border-[#909090]"
                    )}
                    onClick={() => patchForm({ ratio: preset })}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
              <span className="text-lg leading-[23px] text-black tabular-nums">
                {form.ratio}%
              </span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2">
          <CopySideButton
            label="Copy Buy"
            selected={form.buyEnabled}
            tone="buy"
            onClick={() => patchForm({ buyEnabled: !form.buyEnabled })}
          />
          <CopySideButton
            label="Copy Sell"
            selected={form.sellEnabled}
            tone="sell"
            onClick={() => patchForm({ sellEnabled: !form.sellEnabled })}
          />
        </div>

        <section className="rounded-lg border border-[#EBEBEB] bg-white">
          <div className="flex items-center justify-between gap-3 px-3 py-3">
            <p className="text-sm leading-[18px] text-black">
              Advanced Setting
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={cn(
                  "inline-flex h-[26px] items-center justify-center rounded-md px-2.5",
                  "text-sm leading-[18px] text-white transition-opacity",
                  advancedDirty
                    ? "bg-black hover:opacity-90"
                    : "cursor-default bg-[#909090] opacity-50"
                )}
                disabled={!advancedDirty}
                onClick={handleSaveAdvanced}
              >
                Save
              </button>
              <button
                type="button"
                className="inline-flex size-5 items-center justify-center border-0 bg-transparent p-0 text-[#909090] transition-transform"
                aria-label={
                  advancedOpen
                    ? "Collapse advanced settings"
                    : "Expand advanced settings"
                }
                aria-expanded={advancedOpen}
                onClick={() => setAdvancedOpen((current) => !current)}
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    advancedOpen && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          {advancedOpen ? (
            <div className="flex flex-col gap-3 border-t border-[#EBEBEB] px-3 pb-3 pt-3">
              <div>
                <ToggleRow
                  label="Buy only take orders"
                  checked={form.buyTakerOnly}
                  onCheckedChange={(checked) =>
                    patchForm({ buyTakerOnly: checked })
                  }
                  tooltip="Buy orders shall only execute immediately; no GTC maker orders allowed."
                />
                <ToggleRow
                  label="Sell only take orders"
                  checked={form.sellTakerOnly}
                  onCheckedChange={(checked) =>
                    patchForm({ sellTakerOnly: checked })
                  }
                  tooltip="Sell orders shall only execute immediately; no GTC maker orders allowed."
                />
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <CapInput
                  label="Single Order Cap"
                  value={form.maxUsdPerTrade}
                  hint="≥$5"
                  prefix="$"
                  onChange={(value) => patchForm({ maxUsdPerTrade: value })}
                />
                <CapInput
                  label="Per-Market Cap"
                  value={form.maxUsdPerMarket}
                  hint="≥$5"
                  prefix="$"
                  onChange={(value) => patchForm({ maxUsdPerMarket: value })}
                />
                <CapInput
                  label="Hourly Cap"
                  value={form.maxUsdPerHour}
                  hint="≥$5"
                  prefix="$"
                  onChange={(value) => patchForm({ maxUsdPerHour: value })}
                />
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <CapInput
                  label="Total Cap"
                  value={form.maxUsdTotal}
                  hint="≥$5"
                  prefix="$"
                  onChange={(value) => patchForm({ maxUsdTotal: value })}
                  className="sm:col-span-1"
                />
                <CapInput
                  label="Min. Price"
                  value={form.minPrice}
                  hint="0≤x<1"
                  onChange={(value) => patchForm({ minPrice: value })}
                />
                <CapInput
                  label="Max Price"
                  value={form.maxPrice}
                  hint="0<x<1"
                  onChange={(value) => patchForm({ maxPrice: value })}
                />
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <CapInput
                  label="Max Slippage"
                  value={form.maxSlippage}
                  hint="<0.5"
                  onChange={(value) => patchForm({ maxSlippage: value })}
                />
                <div className="flex min-w-0 flex-col gap-1.5">
                  <span className="text-sm leading-[18px] text-[#909090]">
                    Order Type
                  </span>
                  <div className="relative">
                    <select
                      value={form.orderType}
                      onChange={(event) =>
                        patchForm({
                          orderType: event.target
                            .value as WalletCopyFormValues["orderType"]
                        })
                      }
                      className={cn(
                        "h-9 w-full appearance-none rounded-lg border border-[#EBEBEB] bg-white",
                        "px-3 pr-8 text-sm leading-[18px] text-black outline-none",
                        "focus:border-[#909090]"
                      )}
                      aria-label="Order type"
                    >
                      {COPY_TRADE_ORDER_TYPES.map((option) => (
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
          ) : null}
        </section>

        {error ? (
          <p className="m-0 text-sm leading-[18px] text-[#FF674B]">{error}</p>
        ) : null}

        {balanceWarning && !error ? (
          <div className="rounded-lg border border-[#FF674B]/30 bg-[#FF674B]/10 px-3 py-3 text-sm leading-[150%] text-[#FF674B]">
            {balanceWarning}
          </div>
        ) : null}

        {isLoadingBalance && open ? (
          <p className="m-0 text-sm leading-[18px] text-[#909090]">
            Checking copy wallet balance…
          </p>
        ) : null}

        <button
          type="button"
          className={cn(
            "flex h-[50px] w-full items-center justify-center rounded-lg bg-black",
            "text-base leading-5 text-white transition-opacity hover:opacity-90",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          disabled={
            saving ||
            !canSubmitCopy ||
            isLoadingBalance ||
            (!form.buyEnabled && !form.sellEnabled)
          }
          onClick={handleSubmit}
        >
          {saving ? "Saving…" : "Copy"}
        </button>
      </div>
    </Modal>
  );
}

function StatCell({
  label,
  value,
  valueClassName,
  align = "left"
}: {
  label: string;
  value: string;
  valueClassName?: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col justify-center",
        align === "right" && "items-end text-right"
      )}
    >
      <p
        className={cn(
          "truncate text-[14px] leading-[18px] tabular-nums",
          valueClassName ?? "text-black"
        )}
      >
        {value}
      </p>
      <p className="text-[12px] leading-[15px] text-[#909090]">{label}</p>
    </div>
  );
}

function CopySideButton({
  label,
  selected,
  tone,
  onClick
}: {
  label: string;
  selected: boolean;
  tone: "buy" | "sell";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-[42px] items-center justify-center gap-2 rounded-lg",
        "text-base leading-5 text-white transition-opacity hover:opacity-90",
        tone === "buy" ? "bg-[#65AF14]" : "bg-[#FF674B]",
        !selected && "opacity-40"
      )}
      onClick={onClick}
    >
      <Check className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
      {label}
    </button>
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
  onChange,
  className
}: {
  label: string;
  value: string;
  hint: string;
  prefix?: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <span className="text-sm leading-[18px] text-[#909090]">{label}</span>
      <div className="relative flex h-9 items-center rounded-lg border border-[#EBEBEB] bg-white px-3">
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
        />
        <span className="shrink-0 pl-2 text-xs leading-[15px] text-[#909090]">
          {hint}
        </span>
      </div>
    </div>
  );
}

export { CopyTradeInfoIcon, CopyTradeInfoTooltip } from "./info-tooltip";
export type { WalletCopyFormValues, WalletCopyTraderStats } from "./types";
