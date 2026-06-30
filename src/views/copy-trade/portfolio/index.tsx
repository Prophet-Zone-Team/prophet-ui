"use client";

import { useState } from "react";

import { PageBack } from "@/components/ui/page-back";
import { useAuth } from "@/context/auth";
import { cn } from "@/lib/cn";
import { useAuthHydrated } from "@/store/use-auth-hydrated";
import { useAuthStore } from "@/store/auth-store";
import { useCopyTradeStore } from "@/store/copy-trade-store";
import { useCopyTradeHydrated } from "@/store/use-copy-trade-hydrated";
import { CreateTradeWalletModal } from "@/views/copy-trade/create-trade-wallet";
import { openCopyTradeDeposit } from "@/store/copy-trade-funding-store";
import { UserProfileEmptyState } from "@/views/copy-trade/user-profile/empty-state";
import { useCopyTradeProfileStats } from "@/views/copy-trade/use-copy-trade-profile-stats";
import { portfolioPageClass } from "@/views/portfolio/portfolio-ui";

import { CopyTradePortfolioActivity } from "./copy-trade-portfolio-activity";
import { CopyTradePortfolioSummary } from "./copy-trade-portfolio-summary";
import { useCopyTradePortfolioData } from "./use-copy-trade-portfolio-data";

function CopyTradePortfolioSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-[278px] animate-pulse rounded-[20px] border border-prophet-line bg-white" />
      <div className="h-[523px] animate-pulse rounded-[12px] border border-[#EBEBEB] bg-white" />
    </div>
  );
}

export function CopyTradePortfolioView() {
  const authHydrated = useAuthHydrated();
  const copyTradeHydrated = useCopyTradeHydrated();
  const prophetWalletAddress = useAuthStore(
    (state) => state.session?.walletAddress
  );
  const copyWallet = useCopyTradeStore((state) => state.copyWallet);
  const { openLogin } = useAuth();
  const [createWalletOpen, setCreateWalletOpen] = useState(false);

  const hasCopyWallet = Boolean(copyWallet?.CopyDepositWalletAddress);
  const {
    positionsValue,
    openPositions,
    biggestWinAmount,
    isLoadingSummary
  } = useCopyTradeProfileStats({
    enabled: hasCopyWallet
  });
  const {
    openPositions: openPositionRows,
    closedPositions,
    marketContextMap,
    status: positionsStatus
  } = useCopyTradePortfolioData(hasCopyWallet);

  if (!authHydrated || !copyTradeHydrated) {
    return (
      <section className={portfolioPageClass}>
        <PageBack />
        <CopyTradePortfolioSkeleton />
      </section>
    );
  }

  if (!prophetWalletAddress) {
    return (
      <section className={portfolioPageClass}>
        <PageBack />
        <UserProfileEmptyState
          variant="connect"
          onAction={() => void openLogin()}
        />
      </section>
    );
  }

  if (!copyWallet) {
    return (
      <section className={portfolioPageClass}>
        <PageBack />
        <UserProfileEmptyState
          variant="create"
          onAction={() => setCreateWalletOpen(true)}
        />
        <CreateTradeWalletModal
          open={createWalletOpen}
          onClose={() => setCreateWalletOpen(false)}
          onDeposit={() => {
            setCreateWalletOpen(false);
            openCopyTradeDeposit();
          }}
        />
      </section>
    );
  }

  return (
    <section className={cn(portfolioPageClass)}>
      <PageBack />

      <div className="flex flex-col gap-4">
        <CopyTradePortfolioSummary
          copyWallet={copyWallet}
          positionsValue={positionsValue}
          openPositions={openPositions}
          biggestWinAmount={biggestWinAmount}
          isLoading={isLoadingSummary}
          chartEnabled={hasCopyWallet}
        />

        <CopyTradePortfolioActivity
          openPositions={openPositionRows}
          closedPositions={closedPositions}
          marketContextMap={marketContextMap}
          status={positionsStatus}
          needsWallet={false}
          onConnectWallet={() => void openLogin()}
        />
      </div>

      <CreateTradeWalletModal
        open={createWalletOpen}
        onClose={() => setCreateWalletOpen(false)}
        onDeposit={() => {
          setCreateWalletOpen(false);
          openCopyTradeDeposit();
        }}
      />
    </section>
  );
}
