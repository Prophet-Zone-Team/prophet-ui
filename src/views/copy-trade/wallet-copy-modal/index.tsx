"use client";

import { ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import {
  getCopyTargetTotalCapUsage,
  isCopyTargetTotalCapReached
} from "@/lib/copy-trade/copy-target-cap";
import {
  isValidPriceInput,
  isValidSlippageInput,
  isValidUsdCapInput,
  normalizeTargetForm,
  validateTargetForm,
  walletCopyFormToTargetForm,
  type CopyTargetForm
} from "@/lib/copy-trade/transforms";
import type { CopyTargetDisplayStats } from "@/lib/copy-trade/target-stats";
import { formatCompactRelativeTime } from "@/lib/formatters/datetime";
import { formatCompactVolume } from "@/lib/formatters/volume";
import {
  resolveTraderRankDisplayStats,
  type CopyTradeRankTimeRange
} from "@/lib/copy-trade/trader-rank-filters";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import type { CopyTarget, TraderCatalogEntry } from "@/types/copy-trade-api";

import { WalletCopyAdvancedSettingsModal } from "./advanced-settings-modal";
import { CopyTradeInfoTooltip } from "./info-tooltip";
import {
  COPY_TRADE_RATIO_PRESETS,
  DEFAULT_WALLET_COPY_FORM,
  applyAdvancedFields,
  pickAdvancedFields,
  pickDefaultAdvancedFields,
  type WalletCopyAdvancedFields,
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
  existingTarget?: CopyTarget | null;
  autoOpenAdvancedSettings?: boolean;
  onSubmit?: (form: CopyTargetForm) => void | Promise<void>;
  onPersistSettings?: (form: CopyTargetForm) => Promise<boolean>;
}

function withFixedCopyPolicy(
  values: WalletCopyFormValues
): WalletCopyFormValues {
  return {
    ...values,
    buyTakerOnly: true,
    sellTakerOnly: true,
    orderType: "FAK"
  };
}

export function buildTargetFormFromWalletCopy(
  wallet: string,
  values: WalletCopyFormValues,
  existingTarget?: CopyTarget | null
): CopyTargetForm {
  const overrides = existingTarget
    ? {
        enabled: existingTarget.Enabled,
        dryRun: existingTarget.DryRun,
        allowedConditions: existingTarget.AllowedConditions ?? [],
        blockedConditions: existingTarget.BlockedConditions ?? []
      }
    : {
        enabled: true,
        dryRun: false
      };

  return walletCopyFormToTargetForm(wallet, values, overrides);
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

export function buildWalletCopyStatsForManageModal(
  targetStats: CopyTargetDisplayStats | null,
  trader?: TraderCatalogEntry | null
): WalletCopyTraderStats | undefined {
  const winRate = trader
    ? buildWalletCopyStatsFromTrader(trader, "1d").winRate
    : null;

  let pnlUsd: string | null = null;
  if (targetStats?.pnl != null) {
    const sign =
      targetStats.pnl > 0 ? "+" : targetStats.pnl < 0 ? "-" : "";
    pnlUsd = `${sign}${formatTeamDetailMoney(Math.abs(targetStats.pnl))}`;
  }

  const lastTrade = targetStats?.lastTradeAt
    ? formatCompactRelativeTime(targetStats.lastTradeAt) || null
    : null;

  if (pnlUsd == null && winRate == null && lastTrade == null) {
    return undefined;
  }

  return {
    pnlPercent: null,
    pnlUsd,
    winRate,
    lastTrade
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
  existingTarget = null,
  autoOpenAdvancedSettings = false,
  onSubmit,
  onPersistSettings
}: WalletCopyModalProps) {
  const t = useTranslations("copyTrade.walletCopy");
  const tCommon = useTranslations("copyTrade.common");
  const [form, setForm] = useState<WalletCopyFormValues>(() => ({
    ...DEFAULT_WALLET_COPY_FORM,
    ...initialValues
  }));
  const [advancedModalOpen, setAdvancedModalOpen] = useState(false);
  const [advancedDraft, setAdvancedDraft] = useState<WalletCopyAdvancedFields>(
    () => pickDefaultAdvancedFields()
  );
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
    const shouldOpenAdvanced =
      autoOpenAdvancedSettings &&
      existingTarget != null &&
      isCopyTargetTotalCapReached(existingTarget);
    setAdvancedModalOpen(shouldOpenAdvanced);
    setAdvancedDraft(pickAdvancedFields(nextValues));
    setError("");
  }, [autoOpenAdvancedSettings, existingTarget, initialValues, open, wallet]);

  const patchForm = useCallback((patch: Partial<WalletCopyFormValues>) => {
    setError("");
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  const savedAdvanced = useMemo(
    () => pickAdvancedFields(savedSnapshot),
    [savedSnapshot]
  );

  const advancedFieldErrors = useMemo(
    () => ({
      maxUsdPerTrade: !isValidUsdCapInput(form.maxUsdPerTrade),
      maxUsdPerMarket: !isValidUsdCapInput(form.maxUsdPerMarket),
      maxUsdPerHour: !isValidUsdCapInput(form.maxUsdPerHour),
      maxUsdTotal: !isValidUsdCapInput(form.maxUsdTotal),
      minPrice: !isValidPriceInput(form.minPrice),
      maxPrice: !isValidPriceInput(form.maxPrice),
      maxSlippage: !isValidSlippageInput(form.maxSlippage)
    }),
    [form]
  );

  const hasAdvancedFieldErrors = useMemo(
    () => Object.values(advancedFieldErrors).some(Boolean),
    [advancedFieldErrors]
  );

  const advancedDraftFieldErrors = useMemo(
    () => ({
      maxUsdPerTrade: !isValidUsdCapInput(advancedDraft.maxUsdPerTrade),
      maxUsdPerMarket: !isValidUsdCapInput(advancedDraft.maxUsdPerMarket),
      maxUsdPerHour: !isValidUsdCapInput(advancedDraft.maxUsdPerHour),
      maxUsdTotal: !isValidUsdCapInput(advancedDraft.maxUsdTotal),
      minPrice: !isValidPriceInput(advancedDraft.minPrice),
      maxPrice: !isValidPriceInput(advancedDraft.maxPrice),
      maxSlippage: !isValidSlippageInput(advancedDraft.maxSlippage)
    }),
    [advancedDraft]
  );

  const hasAdvancedDraftFieldErrors = useMemo(
    () => Object.values(advancedDraftFieldErrors).some(Boolean),
    [advancedDraftFieldErrors]
  );

  const handleOpenAdvancedModal = useCallback(() => {
    setAdvancedDraft(pickAdvancedFields(form));
    setAdvancedModalOpen(true);
  }, [form]);

  const handleCloseAdvancedModal = useCallback(() => {
    setAdvancedModalOpen(false);
    setAdvancedDraft(pickAdvancedFields(form));
  }, [form]);

  const handlePatchAdvancedDraft = useCallback(
    (patch: Partial<WalletCopyAdvancedFields>) => {
      setAdvancedDraft((current) => ({ ...current, ...patch }));
    },
    []
  );

  const handleClearAdvancedDraft = useCallback(() => {
    setAdvancedDraft(pickDefaultAdvancedFields());
  }, []);

  const handleSaveAdvanced = useCallback(async () => {
    if (hasAdvancedDraftFieldErrors) {
      return;
    }

    const nextForm = withFixedCopyPolicy(
      applyAdvancedFields(form, advancedDraft)
    );
    const draft = buildTargetFormFromWalletCopy(
      wallet,
      nextForm,
      existingTarget
    );
    const errors = validateTargetForm(draft);
    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }

    let normalized: CopyTargetForm;
    try {
      normalized = normalizeTargetForm(draft);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : t("unableToValidate")
      );
      return;
    }

    if (onPersistSettings) {
      const ok = await onPersistSettings(normalized);
      if (!ok) {
        return;
      }
    }

    setError("");
    setForm(nextForm);
    setSavedSnapshot(nextForm);
    setAdvancedDraft(pickAdvancedFields(nextForm));
    setAdvancedModalOpen(false);
  }, [
    advancedDraft,
    existingTarget,
    form,
    hasAdvancedDraftFieldErrors,
    onPersistSettings,
    t,
    wallet
  ]);

  const hasUnsavedAdvancedDraft = useMemo(() => {
    if (advancedModalOpen) {
      return true;
    }

    return (
      Object.keys(advancedDraft) as Array<keyof WalletCopyAdvancedFields>
    ).some((key) => advancedDraft[key] !== savedAdvanced[key]);
  }, [advancedDraft, advancedModalOpen, savedAdvanced]);

  const handleSubmit = useCallback(() => {
    if (!canSubmitCopy) {
      setError(balanceWarning ?? t("balanceUnavailable"));
      return;
    }

    if (!form.buyEnabled && !form.sellEnabled) {
      setError(t("enableCopySide"));
      return;
    }

    if (hasUnsavedAdvancedDraft) {
      if (hasAdvancedDraftFieldErrors) {
        setError(t("invalidAdvancedSettings"));
        return;
      }
    } else if (hasAdvancedFieldErrors) {
      setError(t("invalidAdvancedSettings"));
      return;
    }

    const effectiveForm = withFixedCopyPolicy(
      hasUnsavedAdvancedDraft
        ? applyAdvancedFields(form, advancedDraft)
        : form
    );

    const draft = buildTargetFormFromWalletCopy(
      wallet,
      effectiveForm,
      existingTarget
    );
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
          : t("unableToValidate")
      );
    }
  }, [
    advancedDraft,
    balanceWarning,
    canSubmitCopy,
    form,
    hasAdvancedDraftFieldErrors,
    hasAdvancedFieldErrors,
    existingTarget,
    hasUnsavedAdvancedDraft,
    onSubmit,
    t,
    wallet
  ]);

  const pnlDisplay = formatPnlDisplay(stats);
  const totalCapReached = existingTarget
    ? isCopyTargetTotalCapReached(existingTarget)
    : false;
  const totalCapUsage = existingTarget
    ? getCopyTargetTotalCapUsage(existingTarget)
    : null;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        ariaLabel={t("ariaLabel")}
        escapeCloseable={!advancedModalOpen}
        overlayCloseable={!advancedModalOpen}
        className={cn(
          "w-full max-w-[500px] rounded-[20px] border border-prophet-line bg-prophet-modal-panel",
          "p-5 shadow-[0px_0px_10px_rgba(0,0,0,0.1)]"
        )}
        closeButtonClassName="right-5 top-5 border-0 bg-transparent text-[#909090] hover:bg-transparent hover:text-black dark:hover:text-white"
      >
        <div className="flex flex-col gap-5">
          <header>
            <h2 className="text-xl font-medium leading-[25px] text-prophet-foreground">
              {t("title")}
            </h2>
          </header>

          <section className="flex flex-col gap-2">
            <p className="text-sm leading-[18px] text-prophet-foreground">{t("copyFrom")}</p>
            <div className="box-border flex h-[104px] flex-col rounded-lg border border-prophet-line bg-prophet-panel px-2 py-3">
              <p className="truncate text-[14px] px-[8px] py-[11px] leading-[18px] text-prophet-foreground rounded-[6px] bg-[#F6F6F6] dark:bg-prophet-panel">
                {wallet}
              </p>
              <div className="mt-[10px] flex h-10 items-center px-2">
                <div className="grid h-full w-full grid-cols-3 items-center">
                  <StatCell
                    label={t("pnl")}
                    value={pnlDisplay ?? "—"}
                    valueClassName="text-[#65AF14]"
                  />
                  <StatCell
                    label={t("winRate7d")}
                    value={stats?.winRate ?? "—"}
                    valueClassName="text-[#65AF14]"
                  />
                  <StatCell
                    label={t("lastTrade")}
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
              <p className="text-sm leading-[18px] text-prophet-foreground">
                {t("copyTradeRatio")}
              </p>
              <CopyTradeInfoTooltip content={<>{t("ratioTooltip")}</>} />
            </div>

            <div className="flex flex-col gap-3">
              <div className="relative h-2.5">
                <div className="absolute inset-0 rounded-md border border-prophet-line bg-[#EBEBEB]" />
                <div
                  className="absolute inset-y-0 left-0 rounded-md bg-prophet-primary"
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
                  aria-label={t("ariaCopyRatio")}
                />
                <div
                  className="pointer-events-none absolute top-1/2 size-[18px] -translate-y-1/2 rounded-full border border-[#909090] bg-prophet-primary"
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
                          ? "border-prophet-primary bg-prophet-primary text-white"
                          : "border-prophet-line bg-prophet-panelbg-white text-[#909090] hover:border-[#909090]"
                      )}
                      onClick={() => patchForm({ ratio: preset })}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
                <span className="text-lg leading-[23px] text-prophet-foreground tabular-nums">
                  {form.ratio}%
                </span>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-2">
            <CopySideButton
              label={t("copyBuy")}
              selected={form.buyEnabled}
              tone="buy"
              onClick={() => patchForm({ buyEnabled: !form.buyEnabled })}
            />
            <CopySideButton
              label={t("copySell")}
              selected={form.sellEnabled}
              tone="sell"
              onClick={() => patchForm({ sellEnabled: !form.sellEnabled })}
            />
          </div>

          <button
            type="button"
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-lg border border-prophet-line",
              "bg-prophet-panel px-3 py-3 text-left transition-colors hover:border-[#909090]"
            )}
            aria-label={t("openAdvancedSettings")}
            onClick={handleOpenAdvancedModal}
          >
            <span className="text-sm leading-[18px] text-prophet-foreground">
              {t("advancedSetting")}
            </span>
            <ChevronRight
              className="size-4 shrink-0 text-[#909090]"
              aria-hidden="true"
            />
          </button>

          {error ? (
            <p className="m-0 text-sm leading-[18px] text-[#FF674B]">{error}</p>
          ) : null}

          {balanceWarning && !error ? (
            <div className="rounded-lg border border-[#FF674B]/30 bg-[#FF674B]/10 px-3 py-3 text-sm leading-[150%] text-[#FF674B]">
              {balanceWarning}
            </div>
          ) : null}

          {totalCapReached && totalCapUsage && !error ? (
            <div className="flex flex-col gap-2 rounded-[6px] bg-[#fdd357]/20 px-3 py-2 text-sm leading-[150%] text-[#d1a00f]">
              <p className="m-0">
                {t("totalCapReachedWarning", {
                  used: formatTeamDetailMoney(totalCapUsage.used),
                  max: formatTeamDetailMoney(totalCapUsage.max)
                })}
              </p>
              <button
                type="button"
                className="self-start text-sm font-medium underline underline-offset-2 transition-opacity hover:opacity-70"
                onClick={handleOpenAdvancedModal}
              >
                {t("totalCapReachedRaiseCap")}
              </button>
            </div>
          ) : null}

          {isLoadingBalance && open ? (
            <p className="m-0 text-sm leading-[18px] text-[#909090]">
              {t("checkingBalance")}
            </p>
          ) : null}

          <button
            type="button"
            className={cn(
              "flex h-[50px] w-full items-center justify-center rounded-lg bg-prophet-primary",
              "text-base leading-5 text-white transition-opacity hover:opacity-90",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            disabled={
              saving ||
              !canSubmitCopy ||
              isLoadingBalance ||
              hasAdvancedFieldErrors ||
              (!form.buyEnabled && !form.sellEnabled)
            }
            onClick={handleSubmit}
          >
            {saving ? tCommon("saving") : tCommon("copy")}
          </button>
        </div>
      </Modal>

      <WalletCopyAdvancedSettingsModal
        open={advancedModalOpen}
        draft={advancedDraft}
        savedAdvanced={savedAdvanced}
        saving={saving}
        onDraftChange={handlePatchAdvancedDraft}
        onSave={() => {
          void handleSaveAdvanced();
        }}
        onClose={handleCloseAdvancedModal}
        onClear={handleClearAdvancedDraft}
      />
    </>
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
          valueClassName ?? "text-prophet-foreground"
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
        "inline-flex h-[42px] items-center justify-center gap-2 rounded-lg border text-base leading-5 transition-opacity hover:opacity-90",
        selected
          ? cn(
              "border-transparent text-white",
              tone === "buy" ? "bg-[#65AF14]" : "bg-[#FF674B]"
            )
          : cn(
              "bg-transparent",
              tone === "buy"
                ? "border-[#65AF14] text-[#65AF14]"
                : "border-[#FF674B] text-[#FF674B]"
            )
      )}
      onClick={onClick}
    >
      {selected ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="12"
            viewBox="0 0 16 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 5.05L5.96774 10L15 1"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {label}
        </>
      ) : (
        label
      )}
    </button>
  );
}

export { CopyTradeInfoIcon, CopyTradeInfoTooltip } from "./info-tooltip";
export type { WalletCopyFormValues, WalletCopyTraderStats } from "./types";
