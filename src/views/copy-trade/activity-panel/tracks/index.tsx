"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import {
  newTargetForm,
  targetFormToWalletCopyForm,
  targetToWalletCopyForm,
  type CopyTargetForm
} from "@/lib/copy-trade/transforms";
import { traderRowKey } from "@/lib/copy-trade/trader-catalog-stats";
import type { CopyTarget, TraderCatalogEntry } from "@/types/copy-trade-api";
import { CopyTradeListStatusMessage } from "@/views/copy-trade/list/status-message";
import { useCopyActions } from "@/views/copy-trade/use-copy-actions";
import { useCopyTradeProfile } from "@/views/copy-trade/use-copy-trade-profile";
import { useCopyTradeReadiness } from "@/views/copy-trade/use-copy-trade-readiness";
import { useCopyTradeTargets } from "@/views/copy-trade/use-copy-trade-targets";
import {
  buildWalletCopyStatsFromTrader,
  WalletCopyModal
} from "@/views/copy-trade/wallet-copy-modal";

import { useCopyTradeTracks } from "@/views/copy-trade/use-copy-trade-tracks";

import { TracksEmptyState } from "./empty-state";
import { TracksItem } from "./item";
import { TracksTableHeader } from "./table-header";

export interface TracksListProps {
  className?: string;
  enabled?: boolean;
  importDisabled?: boolean;
  onImport?: () => void;
}

function findTargetByWallet(targets: CopyTarget[], wallet: string) {
  const normalized = wallet.toLowerCase();
  return targets.find((target) => target.Wallet.toLowerCase() === normalized);
}

export function TracksList({
  className,
  enabled = true,
  importDisabled = false,
  onImport
}: TracksListProps) {
  const t = useTranslations("copyTrade.activity");
  const [copyModalTrader, setCopyModalTrader] =
    useState<TraderCatalogEntry | null>(null);

  const { tracks, isLoading, isError, error } = useCopyTradeTracks({ enabled });
  const { profile } = useCopyTradeProfile({ enabled });
  const { targets } = useCopyTradeTargets({ enabled });
  const { saving, upsertCopy } = useCopyActions();
  const readiness = useCopyTradeReadiness();

  const copyModalStats = useMemo(
    () =>
      copyModalTrader
        ? buildWalletCopyStatsFromTrader(copyModalTrader, "all")
        : undefined,
    [copyModalTrader]
  );

  const copyModalInitialValues = useMemo(() => {
    if (!copyModalTrader) {
      return undefined;
    }

    const existingTarget = findTargetByWallet(targets, copyModalTrader.Wallet);
    if (existingTarget) {
      return targetToWalletCopyForm(existingTarget);
    }

    return targetFormToWalletCopyForm(
      newTargetForm(copyModalTrader.Wallet, profile, true)
    );
  }, [copyModalTrader, profile, targets]);

  const handleCopyTrade = useCallback(
    (trader: TraderCatalogEntry) => {
      if (!readiness.canOpenCopy) {
        return;
      }

      setCopyModalTrader(trader);
    },
    [readiness.canOpenCopy]
  );

  const handleCopySubmit = useCallback(
    async (form: CopyTargetForm) => {
      const ok = await upsertCopy(form);
      if (ok) {
        setCopyModalTrader(null);
      }
    },
    [upsertCopy]
  );

  const tracksItemProps = (trader: TraderCatalogEntry) => ({
    trader,
    onCopyTrade: handleCopyTrade,
    copyTradeDisabled: !readiness.canOpenCopy,
    copyTradeDisabledReason: readiness.disabledReason,
    copyTradeBusy: saving
  });

  if (isLoading) {
    return (
      <CopyTradeListStatusMessage
        className={cn("min-h-0 flex-1 px-3 py-4", className)}
      >
        {t("loadingTracks")}
      </CopyTradeListStatusMessage>
    );
  }

  if (isError) {
    return (
      <CopyTradeListStatusMessage
        className={cn("min-h-0 flex-1 px-3 py-4", className)}
      >
        {error instanceof Error ? error.message : t("unableToLoadTracks")}
      </CopyTradeListStatusMessage>
    );
  }

  if (tracks.length === 0) {
    return (
      <TracksEmptyState
        className={cn("min-h-0 flex-1 px-3 py-4", className)}
        disabled={importDisabled}
        onImport={onImport}
      />
    );
  }

  return (
    <>
      <div
        className={cn("flex min-h-0 flex-1 flex-col px-3", className)}
        aria-label={t("ariaTracks")}
      >
        <TracksTableHeader />
        <ul className="mt-3 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          {tracks.map((trader) => (
            <li key={traderRowKey(trader)}>
              <TracksItem {...tracksItemProps(trader)} />
            </li>
          ))}
        </ul>
      </div>

      <WalletCopyModal
        open={copyModalTrader != null}
        onClose={() => setCopyModalTrader(null)}
        wallet={copyModalTrader?.Wallet ?? ""}
        stats={copyModalStats}
        initialValues={copyModalInitialValues}
        existingTarget={
          copyModalTrader
            ? findTargetByWallet(targets, copyModalTrader.Wallet) ?? null
            : null
        }
        saving={saving}
        availableBalance={readiness.availableBalance}
        isLoadingBalance={readiness.isLoadingBalance}
        canSubmitCopy={readiness.canSubmitCopy}
        balanceWarning={readiness.balanceWarning}
        onSubmit={handleCopySubmit}
      />
    </>
  );
}
