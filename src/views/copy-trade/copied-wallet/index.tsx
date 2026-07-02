"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { isCopyTargetTotalCapReached } from "@/lib/copy-trade/copy-target-cap";
import { getCopyTargetStats } from "@/lib/copy-trade/target-stats";
import { targetToWalletCopyForm } from "@/lib/copy-trade/transforms";
import type { CopyTargetForm } from "@/lib/copy-trade/transforms";
import type { CopyTarget, TraderCatalogEntry } from "@/types/copy-trade-api";
import { copyTradeTableMobileListClass } from "@/views/copy-trade/copy-trade-ui";
import { CopyTradeListStatusMessage } from "@/views/copy-trade/list/status-message";
import { useCopyActions } from "@/views/copy-trade/use-copy-actions";
import { useCopyTradeRank } from "@/views/copy-trade/use-copy-trade-rank";
import { useCopyTradeReadiness } from "@/views/copy-trade/use-copy-trade-readiness";
import { useCopyTradeTargetStats } from "@/views/copy-trade/use-copy-trade-target-stats";
import { useCopyTradeTargets } from "@/views/copy-trade/use-copy-trade-targets";
import {
  buildWalletCopyStatsForManageModal,
  WalletCopyModal
} from "@/views/copy-trade/wallet-copy-modal";

import { CopyTradeCopiedWalletItem } from "./item";
import {
  copyTradeCopiedWalletGridStyle,
  copyTradeCopiedWalletTableGridClass
} from "./grid";
import { CopyTradeCopiedWalletTableHeader } from "./table-header";

export interface CopyTradeCopiedWalletPanelProps {
  className?: string;
  enabled?: boolean;
}

function buildTradersByWallet(
  traders: TraderCatalogEntry[]
): Map<string, TraderCatalogEntry> {
  const map = new Map<string, TraderCatalogEntry>();

  for (const trader of traders) {
    map.set(trader.Wallet.toLowerCase(), trader);
  }

  return map;
}

export function CopyTradeCopiedWalletPanel({
  className,
  enabled = true
}: CopyTradeCopiedWalletPanelProps) {
  const t = useTranslations("copyTrade.copiedWallet");
  const {
    targets,
    isLoading,
    isError,
    error: errorDetail,
    hasSession
  } = useCopyTradeTargets({ enabled });
  const { traders } = useCopyTradeRank({ enabled });
  const { statsByWallet } = useCopyTradeTargetStats({ enabled, targets });
  const { saving, upsertCopy, updateCopySettings, setPaused, removeCopy } =
    useCopyActions();
  const readiness = useCopyTradeReadiness();
  const [manageTarget, setManageTarget] = useState<CopyTarget | null>(null);

  const tradersByWallet = useMemo(
    () => buildTradersByWallet(traders),
    [traders]
  );

  const manageInitialValues = useMemo(
    () =>
      manageTarget ? targetToWalletCopyForm(manageTarget) : undefined,
    [manageTarget]
  );

  const manageModalStats = useMemo(() => {
    if (!manageTarget) {
      return undefined;
    }

    const targetStats = getCopyTargetStats(statsByWallet, manageTarget.Wallet);
    const trader = tradersByWallet.get(manageTarget.Wallet.toLowerCase()) ?? null;

    return buildWalletCopyStatsForManageModal(targetStats, trader);
  }, [manageTarget, statsByWallet, tradersByWallet]);

  const manageTargetCapReached = useMemo(
    () => (manageTarget ? isCopyTargetTotalCapReached(manageTarget) : false),
    [manageTarget]
  );

  const handleCopySubmit = useCallback(
    async (form: CopyTargetForm) => {
      const ok = await upsertCopy(form);
      if (ok) {
        setManageTarget(null);
      }
    },
    [upsertCopy]
  );

  const handlePersistSettings = useCallback(
    async (form: CopyTargetForm) => updateCopySettings(form),
    [updateCopySettings]
  );

  const handlePauseToggle = useCallback(
    (target: CopyTarget) => {
      void setPaused(target, target.Enabled);
    },
    [setPaused]
  );

  const handleRemove = useCallback(
    (target: CopyTarget) => {
      void removeCopy(target.Wallet);
    },
    [removeCopy]
  );

  const copiedWalletItemProps = (target: CopyTarget) => ({
    target,
    trader: tradersByWallet.get(target.Wallet.toLowerCase()) ?? null,
    stats: getCopyTargetStats(statsByWallet, target.Wallet),
    saving,
    onManage: setManageTarget,
    onPauseToggle: handlePauseToggle,
    onRemove: handleRemove
  });

  const renderCopiedWalletList = (layout: "desktop" | "mobile") => {
    const statusClassName = layout === "desktop" ? "col-span-full" : undefined;

    if (!hasSession) {
      return (
        <CopyTradeListStatusMessage className={statusClassName}>
          {t("createWalletToView")}
        </CopyTradeListStatusMessage>
      );
    }

    if (isLoading) {
      return (
        <CopyTradeListStatusMessage className={statusClassName}>
          {t("loading")}
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

    if (targets.length === 0) {
      return (
        <CopyTradeListStatusMessage className={statusClassName}>
          {t("empty")}
        </CopyTradeListStatusMessage>
      );
    }

    return targets.map((target) => (
      <CopyTradeCopiedWalletItem
        key={target.Wallet}
        layout={layout}
        {...copiedWalletItemProps(target)}
      />
    ));
  };

  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <div
        className={cn(copyTradeTableMobileListClass, "mt-4 gap-3 px-4 md:px-0")}
        aria-label={t("ariaList")}
      >
        {renderCopiedWalletList("mobile")}
      </div>

      <div
        style={copyTradeCopiedWalletGridStyle}
        className={cn(
          "mt-4 hidden gap-y-2 md:grid",
          copyTradeCopiedWalletTableGridClass
        )}
        aria-label={t("ariaList")}
      >
        <CopyTradeCopiedWalletTableHeader className="col-span-full" />
        {renderCopiedWalletList("desktop")}
      </div>

      <WalletCopyModal
        open={manageTarget != null}
        onClose={() => setManageTarget(null)}
        wallet={manageTarget?.Wallet ?? ""}
        stats={manageModalStats}
        initialValues={manageInitialValues}
        existingTarget={manageTarget}
        autoOpenAdvancedSettings={manageTargetCapReached}
        saving={saving}
        availableBalance={readiness.availableBalance}
        isLoadingBalance={readiness.isLoadingBalance}
        canSubmitCopy={readiness.canSubmitCopy}
        balanceWarning={readiness.balanceWarning}
        onSubmit={handleCopySubmit}
        onPersistSettings={
          manageTarget != null ? handlePersistSettings : undefined
        }
      />
    </div>
  );
}
