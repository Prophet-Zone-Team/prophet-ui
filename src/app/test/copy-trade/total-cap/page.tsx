"use client";

import { useMemo, useState } from "react";

import { targetToWalletCopyForm } from "@/lib/copy-trade/transforms";
import {
  COPY_TRADE_TOTAL_CAP_MODAL_TARGET,
  COPY_TRADE_TOTAL_CAP_PREVIEW_SCENARIOS
} from "@/data/mock/copy-trade-total-cap-preview";
import { CopyTradeCopiedWalletItem } from "@/views/copy-trade/copied-wallet/item";
import {
  copyTradeCopiedWalletGridStyle,
  copyTradeCopiedWalletTableGridClass
} from "@/views/copy-trade/copied-wallet/grid";
import { CopyTradeCopiedWalletTableHeader } from "@/views/copy-trade/copied-wallet/table-header";
import { copyTradeTableMobileListClass } from "@/views/copy-trade/copy-trade-ui";
import { WalletCopyModal } from "@/views/copy-trade/wallet-copy-modal";

const testButtonClass =
  "rounded-lg border border-[#ebebeb] bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[#fafafa]";

export default function CopyTradeTotalCapPreviewPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState(COPY_TRADE_TOTAL_CAP_MODAL_TARGET);

  const modalInitialValues = useMemo(
    () => targetToWalletCopyForm(modalTarget),
    [modalTarget]
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-black">
        Copy Trade Total Cap Preview
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-[#909090]">
        Local UI preview for total cap reached states. Open at{" "}
        <code className="text-black">/test/copy-trade/total-cap</code> while{" "}
        <code className="text-black">pnpm dev</code> is running.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-medium text-[#909090]">Wallet copy modal</h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={testButtonClass}
            onClick={() => {
              setModalTarget(COPY_TRADE_TOTAL_CAP_MODAL_TARGET);
              setModalOpen(true);
            }}
          >
            Cap reached (enabled)
          </button>
          <button
            type="button"
            className={testButtonClass}
            onClick={() => {
              const scenario = COPY_TRADE_TOTAL_CAP_PREVIEW_SCENARIOS.find(
                (item) => item.id === "running"
              );
              if (scenario) {
                setModalTarget(scenario.target);
                setModalOpen(true);
              }
            }}
          >
            Under cap (no warning)
          </button>
        </div>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-sm font-medium text-[#909090]">
          Copied wallet list (desktop)
        </h2>
        <div
          style={copyTradeCopiedWalletGridStyle}
          className={`grid gap-y-2 ${copyTradeCopiedWalletTableGridClass}`}
        >
          <CopyTradeCopiedWalletTableHeader className="col-span-full" />
          {COPY_TRADE_TOTAL_CAP_PREVIEW_SCENARIOS.map((scenario) => (
            <div key={scenario.id} className="col-span-full space-y-1">
              <p className="px-1 text-xs text-[#909090]">
                {scenario.label} — {scenario.description}
              </p>
              <CopyTradeCopiedWalletItem
                target={scenario.target}
                stats={scenario.stats}
                layout="desktop"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-sm font-medium text-[#909090]">
          Copied wallet cards (mobile)
        </h2>
        <div className={`${copyTradeTableMobileListClass} gap-3`}>
          {COPY_TRADE_TOTAL_CAP_PREVIEW_SCENARIOS.map((scenario) => (
            <div key={scenario.id} className="space-y-1">
              <p className="px-1 text-xs text-[#909090]">{scenario.label}</p>
              <CopyTradeCopiedWalletItem
                target={scenario.target}
                stats={scenario.stats}
                layout="mobile"
              />
            </div>
          ))}
        </div>
      </section>

      <WalletCopyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        wallet={modalTarget.Wallet}
        initialValues={modalInitialValues}
        existingTarget={modalTarget}
        canSubmitCopy
        availableBalance={250}
        onSubmit={async () => {
          setModalOpen(false);
        }}
      />
    </div>
  );
}
