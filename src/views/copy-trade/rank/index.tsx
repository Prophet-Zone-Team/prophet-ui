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
import type {
  CopyTradeRankTimeRange,
  CopyTradeRankWalletType
} from "@/lib/copy-trade/trader-rank-filters";
import type { CopyTarget, TraderCatalogEntry } from "@/types/copy-trade-api";
import { CopyTradeListStatusMessage } from "@/views/copy-trade/list/status-message";
import { copyTradeTableMobileListClass } from "@/views/copy-trade/copy-trade-ui";
import { useCopyActions } from "@/views/copy-trade/use-copy-actions";
import { useCopyTradeProfile } from "@/views/copy-trade/use-copy-trade-profile";
import { useCopyTradeReadiness } from "@/views/copy-trade/use-copy-trade-readiness";
import { useCopyTradeRank } from "@/views/copy-trade/use-copy-trade-rank";
import { useCopyTradeTrackActions } from "@/views/copy-trade/use-copy-trade-track-actions";
import { useCopyTradeTracks } from "@/views/copy-trade/use-copy-trade-tracks";
import { useCopyTradeTargets } from "@/views/copy-trade/use-copy-trade-targets";
import {
  buildWalletCopyStatsFromTrader,
  WalletCopyModal
} from "@/views/copy-trade/wallet-copy-modal";

import { CopyTradeRankFilterToolbar } from "./filter-toolbar";
import {
  copyTradeRankGridStyle,
  copyTradeRankTableGridClass
} from "./grid";
import { CopyTradeRankItem } from "./item";
import { CopyTradeRankTableHeader } from "./table-header";

export interface CopyTradeRankPanelProps {
  className?: string;
  enabled?: boolean;
}

function findTargetByWallet(targets: CopyTarget[], wallet: string) {
  const normalized = wallet.toLowerCase();
  return targets.find((target) => target.Wallet.toLowerCase() === normalized);
}

export function CopyTradeRankPanel({
  className,
  enabled = true
}: CopyTradeRankPanelProps) {
  const t = useTranslations("copyTrade.rank");
  const [walletType, setWalletType] = useState<CopyTradeRankWalletType>("all");
  const [timeRange, setTimeRange] = useState<CopyTradeRankTimeRange>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copyModalTrader, setCopyModalTrader] =
    useState<TraderCatalogEntry | null>(null);

  const { profile } = useCopyTradeProfile({ enabled });
  const { targets } = useCopyTradeTargets({ enabled });
  const { trackedWallets } = useCopyTradeTracks({ enabled });
  const { toggleTrack } = useCopyTradeTrackActions();
  const { saving, upsertCopy } = useCopyActions();
  const readiness = useCopyTradeReadiness();

  const handleTrackToggle = useCallback(
    (trader: TraderCatalogEntry) => {
      const normalizedWallet = trader.Wallet.toLowerCase();
      void toggleTrack(trader, trackedWallets.has(normalizedWallet));
    },
    [toggleTrack, trackedWallets]
  );

  const filters = useMemo(
    () => ({
      walletType,
      timeRange,
      searchQuery
    }),
    [searchQuery, timeRange, walletType]
  );

  const {
    traders,
    isLoading,
    isFetching,
    isError,
    error: errorDetail,
    refetch
  } = useCopyTradeRank({ enabled, filters });

  const copyModalStats = useMemo(
    () =>
      copyModalTrader
        ? buildWalletCopyStatsFromTrader(copyModalTrader, timeRange)
        : undefined,
    [copyModalTrader, timeRange]
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

  const rankItemProps = (trader: TraderCatalogEntry, index: number) => ({
    rank: index + 1,
    trader,
    timeRange,
    tracked: trackedWallets.has(trader.Wallet.toLowerCase()),
    onTrackToggle: handleTrackToggle,
    onCopyTrade: handleCopyTrade,
    copyTradeDisabled: !readiness.canOpenCopy,
    copyTradeDisabledReason: readiness.disabledReason,
    copyTradeBusy: saving
  });

  const renderRankList = (layout: "desktop" | "mobile") => {
    const statusClassName = layout === "desktop" ? "col-span-full" : undefined;

    if (isLoading) {
      return (
        <CopyTradeListStatusMessage className={statusClassName}>
          {t("loadingTraders")}
        </CopyTradeListStatusMessage>
      );
    }

    if (isError) {
      return (
        <CopyTradeListStatusMessage className={statusClassName}>
          {errorDetail instanceof Error
            ? errorDetail.message
            : t("unableToLoad")}
        </CopyTradeListStatusMessage>
      );
    }

    if (traders.length === 0) {
      return (
        <CopyTradeListStatusMessage className={statusClassName}>
          {t("noTraders")}
        </CopyTradeListStatusMessage>
      );
    }

    return traders.map((trader, index) => (
      <CopyTradeRankItem
        key={traderRowKey(trader)}
        layout={layout}
        {...rankItemProps(trader, index)}
      />
    ));
  };

  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <CopyTradeRankFilterToolbar
        className="mt-4"
        walletType={walletType}
        timeRange={timeRange}
        searchQuery={searchQuery}
        refreshing={isFetching && !isLoading}
        onWalletTypeChange={setWalletType}
        onTimeRangeChange={setTimeRange}
        onSearchQueryChange={setSearchQuery}
        onRefresh={() => void refetch()}
      />

      <div
        className={cn(copyTradeTableMobileListClass, "mt-3 gap-3 px-4 md:px-0")}
        aria-label={t("ariaList")}
      >
        {renderRankList("mobile")}
      </div>

      <div
        style={copyTradeRankGridStyle}
        className={cn(
          "mt-3 hidden gap-y-2 md:grid",
          copyTradeRankTableGridClass
        )}
        aria-label={t("ariaList")}
      >
        <CopyTradeRankTableHeader className="col-span-full" />
        {renderRankList("desktop")}
      </div>

      <WalletCopyModal
        open={copyModalTrader != null}
        onClose={() => setCopyModalTrader(null)}
        wallet={copyModalTrader?.Wallet ?? ""}
        stats={copyModalStats}
        initialValues={copyModalInitialValues}
        saving={saving}
        availableBalance={readiness.availableBalance}
        isLoadingBalance={readiness.isLoadingBalance}
        canSubmitCopy={readiness.canSubmitCopy}
        balanceWarning={readiness.balanceWarning}
        onSubmit={handleCopySubmit}
      />
    </div>
  );
}
