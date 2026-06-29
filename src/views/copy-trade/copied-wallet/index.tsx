"use client";

import { useCallback, useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { getCopyTargetStats } from "@/lib/copy-trade/target-stats";
import { targetToWalletCopyForm } from "@/lib/copy-trade/transforms";
import type { CopyTargetForm } from "@/lib/copy-trade/transforms";
import type { CopyTarget, TraderCatalogEntry } from "@/types/copy-trade-api";
import { CopyTradeListStatusMessage } from "@/views/copy-trade/list/status-message";
import { useCopyActions } from "@/views/copy-trade/use-copy-actions";
import { useCopyTradeRank } from "@/views/copy-trade/use-copy-trade-rank";
import { useCopyTradeReadiness } from "@/views/copy-trade/use-copy-trade-readiness";
import { useCopyTradeTargetStats } from "@/views/copy-trade/use-copy-trade-target-stats";
import { useCopyTradeTargets } from "@/views/copy-trade/use-copy-trade-targets";
import { WalletCopyModal } from "@/views/copy-trade/wallet-copy-modal";

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
  const {
    targets,
    isLoading,
    isError,
    error: errorDetail,
    hasSession
  } = useCopyTradeTargets({ enabled });
  const { traders } = useCopyTradeRank({ enabled });
  const { statsByWallet } = useCopyTradeTargetStats({ enabled, targets });
  const { saving, upsertCopy, setPaused, removeCopy } = useCopyActions();
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

  const handleCopySubmit = useCallback(
    async (form: CopyTargetForm) => {
      const ok = await upsertCopy(form);
      if (ok) {
        setManageTarget(null);
      }
    },
    [upsertCopy]
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

  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <div
        style={copyTradeCopiedWalletGridStyle}
        className={cn(
          "mt-4 flex flex-col gap-y-2 md:grid",
          copyTradeCopiedWalletTableGridClass
        )}
        aria-label="Copied wallet list"
      >
        <CopyTradeCopiedWalletTableHeader className="hidden md:grid" />
        {!hasSession ? (
          <CopyTradeListStatusMessage className="md:col-span-full">
            Create a copy-trade wallet to view copied wallets.
          </CopyTradeListStatusMessage>
        ) : isLoading ? (
          <CopyTradeListStatusMessage className="md:col-span-full">
            Loading copied wallets…
          </CopyTradeListStatusMessage>
        ) : isError ? (
          <CopyTradeListStatusMessage className="md:col-span-full">
            {errorDetail instanceof Error
              ? errorDetail.message
              : "Unable to load copied wallets."}
          </CopyTradeListStatusMessage>
        ) : targets.length > 0 ? (
          targets.map((target) => (
            <CopyTradeCopiedWalletItem
              key={target.Wallet}
              target={target}
              trader={tradersByWallet.get(target.Wallet.toLowerCase()) ?? null}
              stats={getCopyTargetStats(statsByWallet, target.Wallet)}
              saving={saving}
              onManage={setManageTarget}
              onPauseToggle={handlePauseToggle}
              onRemove={handleRemove}
            />
          ))
        ) : (
          <CopyTradeListStatusMessage className="md:col-span-full">
            No copied wallets yet.
          </CopyTradeListStatusMessage>
        )}
      </div>

      <WalletCopyModal
        open={manageTarget != null}
        onClose={() => setManageTarget(null)}
        wallet={manageTarget?.Wallet ?? ""}
        initialValues={manageInitialValues}
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
