"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import type { CopyTarget } from "@/types/copy-trade-api";
import { CopyTradeListStatusMessage } from "@/views/copy-trade/list/status-message";
import { useCopyTradeTargets } from "@/views/copy-trade/use-copy-trade-targets";
import {
  buildWalletCopyFormFromTarget,
  WalletCopyModal
} from "@/views/copy-trade/wallet-copy-modal";

import { CopyTradeCopiedWalletItem } from "./item";
import { CopyTradeCopiedWalletTableHeader } from "./table-header";

export interface CopyTradeCopiedWalletPanelProps {
  className?: string;
  enabled?: boolean;
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
  const [manageTarget, setManageTarget] = useState<CopyTarget | null>(null);

  const manageInitialValues = useMemo(
    () =>
      manageTarget ? buildWalletCopyFormFromTarget(manageTarget) : undefined,
    [manageTarget]
  );

  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <CopyTradeCopiedWalletTableHeader className="mt-4 hidden md:grid" />
      <div
        className="mt-3 flex flex-col gap-y-2"
        aria-label="Copied wallet list"
      >
        {!hasSession ? (
          <CopyTradeListStatusMessage>
            Create a copy-trade wallet to view copied wallets.
          </CopyTradeListStatusMessage>
        ) : isLoading ? (
          <CopyTradeListStatusMessage>
            Loading copied wallets…
          </CopyTradeListStatusMessage>
        ) : isError ? (
          <CopyTradeListStatusMessage>
            {errorDetail instanceof Error
              ? errorDetail.message
              : "Unable to load copied wallets."}
          </CopyTradeListStatusMessage>
        ) : targets.length > 0 ? (
          targets.map((target) => (
            <CopyTradeCopiedWalletItem
              key={target.Wallet}
              target={target}
              onManage={setManageTarget}
            />
          ))
        ) : (
          <CopyTradeListStatusMessage>
            No copied wallets yet.
          </CopyTradeListStatusMessage>
        )}
      </div>

      <WalletCopyModal
        open={manageTarget != null}
        onClose={() => setManageTarget(null)}
        wallet={manageTarget?.Wallet ?? ""}
        initialValues={manageInitialValues}
      />
    </div>
  );
}
