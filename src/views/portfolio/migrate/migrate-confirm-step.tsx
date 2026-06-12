"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import InputNumber from "@/components/input-number";
import { POLYMARKET_USD } from "@/config/funding";
import { getLegacyAccountLabelKey, MIN_MIGRATION_USD } from "@/lib/trading/migrate/polymarket-migration";
import { validateMigrationAmount } from "@/lib/trading/migrate/execute-migration";
import type { LegacyMigrationAccount } from "@/lib/trading/migrate/types";
import {
  migrateAddressRowClass,
  migrateAddressRowValueClass,
  migrateAmountInputClass,
  migrateAmountInputWrapClass,
  migrateConfirmBodyClass,
  migratePercentButtonClass,
  migratePrimaryButtonClass,
  migrateSectionLabelClass,
  migrateTransferBarClass,
  migrateTransferLabelClass,
  migrateTransferSideClass,
  migrateTransferSubLabelClass,
} from "@/views/portfolio/migrate/migrate-ui";
import { cn } from "@/lib/cn";
import Big from "big.js";
import { numberRemoveEndZero } from "@stableflow/core";

const PERCENT_OPTIONS = [25, 50, 75, 100] as const;

export interface MigrateConfirmStepProps {
  sourceAccount: LegacyMigrationAccount;
  destinationAddress: string;
  submitting: boolean;
  submitError?: string;
  onSubmit: (amountUsd: number) => void | Promise<void>;
}

export function MigrateConfirmStep({
  sourceAccount,
  destinationAddress,
  submitting,
  submitError,
  onSubmit,
}: MigrateConfirmStepProps) {
  const t = useTranslations("portfolio.migrate");
  const [inputValue, setInputValue] = useState(() =>
    formatUsdInput(sourceAccount.balanceUsd),
  );

  const amountUsd = useMemo(() => parseUsdInput(inputValue), [inputValue]);
  const validationKey = useMemo(
    () => (amountUsd === undefined ? "amountZero" : validateMigrationAmount(amountUsd, sourceAccount.balanceUsd)),
    [amountUsd, sourceAccount.balanceUsd],
  );
  const validationError = validationKey
    ? validationKey === "amountBelowMinimum"
      ? t("amountBelowMinimum", { amount: `$${MIN_MIGRATION_USD}` })
      : validationKey === "amountExceedsBalance"
        ? t("amountExceedsBalance")
        : t("amountZero")
    : undefined;

  const canSubmit = !validationKey && !submitting && amountUsd !== undefined;

  function applyPercent(percent: number) {
    const nextAmount = Big(sourceAccount.balanceUsd || 0).times(percent).div(100);
    setInputValue(formatUsdInput(nextAmount));
  }

  return (
    <div className={migrateConfirmBodyClass}>
      <div className="space-y-1">
        <div className={migrateAddressRowClass}>
          <span className="shrink-0">{t("sourceAccount")}</span>
          <span className="flex-1 h-[1px] bg-[#EBEBEB] translate-y-[10px]"></span>
          <span className={migrateAddressRowValueClass}>{sourceAccount.address}</span>
        </div>
        <div className={migrateAddressRowClass}>
          <span>{t("destinationAccount")}</span>
          <span className="flex-1 h-[1px] bg-[#EBEBEB] translate-y-[10px]"></span>
          <span className={migrateAddressRowValueClass}>{destinationAddress}</span>
        </div>
      </div>

      <div className="mt-8">
        <div className={migrateAmountInputWrapClass}>
          <InputNumber
            prefix="$"
            value={inputValue}
            onNumberChange={setInputValue}
            className={migrateAmountInputClass}
            aria-label={t("amountAria")}
            placeholder="0"
          />
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {PERCENT_OPTIONS.map((percent) => (
            <button
              key={percent}
              type="button"
              className={migratePercentButtonClass}
              onClick={() => applyPercent(percent)}
            >
              {percent}%
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-6">
        <div className="mb-2 flex items-center justify-between px-1 text-sm text-[#909090]">
          <span>{t("from")}</span>
          <span>{t("to")}</span>
        </div>
        <div className={migrateTransferBarClass}>
          <div className={migrateTransferSideClass}>
            <img
              src={POLYMARKET_USD.icon}
              alt=""
              width={30}
              height={30}
              className="shrink-0 rounded-full"
            />
            <div className="min-w-0">
              <p className={migrateTransferLabelClass}>USDC</p>
              <p className={migrateTransferSubLabelClass}>
                {t(getLegacyAccountLabelKey(sourceAccount.type))}
              </p>
            </div>
          </div>

          <div className="flex justify-center items-center">
            <ArrowRight className="h-3 w-5 shrink-0 text-black" aria-hidden="true" />
          </div>

          <div className={cn(migrateTransferSideClass, "justify-end")}>
            <div className="min-w-0 text-right">
              <p className={migrateTransferLabelClass}>{POLYMARKET_USD.symbol}</p>
              <p className={migrateTransferSubLabelClass}>{t("prophetAccount")}</p>
            </div>
            <img
              src={POLYMARKET_USD.icon}
              alt=""
              width={30}
              height={30}
              className="shrink-0 rounded-full"
            />
          </div>
        </div>
      </div>

      {validationError ? (
        <p className="mt-3 text-center text-sm text-[#d1a00f]">{validationError}</p>
      ) : null}
      {submitError ? (
        <p className="mt-3 text-center text-sm text-red-600">{submitError}</p>
      ) : null}

      <div className="mt-auto pt-6">
        <button
          type="button"
          className={migratePrimaryButtonClass}
          disabled={!canSubmit}
          onClick={() => {
            if (amountUsd !== undefined) {
              void onSubmit(amountUsd);
            }
          }}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              {t("migrating")}
            </>
          ) : (
            t("migrateNow")
          )}
        </button>
      </div>
    </div>
  );
}

function parseUsdInput(value: string) {
  const normalized = value.replace(/,/g, "").trim();

  if (!normalized || !/^\d+(?:\.\d{1,6})?$/.test(normalized)) {
    return undefined;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function formatUsdInput(value: number | string | Big.Big): string {
  const fixed = Big(value || 0).toFixed(6, Big.roundDown);
  return numberRemoveEndZero(fixed);
}
