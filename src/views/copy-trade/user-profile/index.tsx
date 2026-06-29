"use client";

import { useState } from "react";

import { useAuth } from "@/context/auth/use-auth";
import { cn } from "@/lib/cn";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import { useAuthHydrated } from "@/store/use-auth-hydrated";
import { useAuthStore } from "@/store/auth-store";
import { useCopyTradeStore } from "@/store/copy-trade-store";
import { useCopyTradeHydrated } from "@/store/use-copy-trade-hydrated";
import { CreateTradeWalletModal } from "@/views/copy-trade/create-trade-wallet";
import { useCopyTradeProfileStats } from "@/views/copy-trade/use-copy-trade-profile-stats";

import { ActionGroup } from "./action-group";
import { UserProfileEmptyState } from "./empty-state";
import { ProfileHeader } from "./profile-header";
import { StatItem } from "./stat-item";
import { StatusStat } from "./status-stat";
import { UserProfileCard } from "./user-profile-card";

export interface CopyTradeUserProfileProps {
  className?: string;
}

function formatStatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return formatTeamDetailMoney(value);
}

function formatStatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return value.toLocaleString("en-US");
}

function UserProfileSkeleton({ className }: { className?: string }) {
  return (
    <UserProfileCard
      className={cn(
        "flex h-[262px] animate-pulse flex-col gap-5 p-5",
        className
      )}
      aria-hidden="true"
    >
      <div className="h-8 w-40 rounded bg-[#EBEBEB]" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-12 rounded bg-[#EBEBEB]" />
        <div className="h-12 rounded bg-[#EBEBEB]" />
        <div className="h-12 rounded bg-[#EBEBEB]" />
        <div className="h-12 rounded bg-[#EBEBEB]" />
      </div>
    </UserProfileCard>
  );
}

export function CopyTradeUserProfile({ className }: CopyTradeUserProfileProps) {
  const authHydrated = useAuthHydrated();
  const copyTradeHydrated = useCopyTradeHydrated();
  const prophetWalletAddress = useAuthStore(
    (state) => state.session?.walletAddress
  );
  const copyWallet = useCopyTradeStore((state) => state.copyWallet);
  const { openLogin } = useAuth();
  const [createWalletOpen, setCreateWalletOpen] = useState(false);
  const {
    balance,
    totalPnL,
    totalTrades,
    isLoadingBalance,
    isLoadingPnL
  } = useCopyTradeProfileStats({
    enabled: Boolean(copyWallet),
  });

  if (!authHydrated || !copyTradeHydrated) {
    return <UserProfileSkeleton className={className} />;
  }

  if (!prophetWalletAddress) {
    return (
      <UserProfileEmptyState
        className={className}
        variant="connect"
        onAction={() => void openLogin()}
      />
    );
  }

  if (!copyWallet) {
    return (
      <>
        <UserProfileEmptyState
          className={className}
          variant="create"
          onAction={() => setCreateWalletOpen(true)}
        />
        <CreateTradeWalletModal
          open={createWalletOpen}
          onClose={() => setCreateWalletOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <UserProfileCard className={cn("p-5", className)}>
        <ProfileHeader copyWallet={copyWallet} />

        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
          <StatItem
            label="Balance"
            value={formatStatMoney(balance)}
            isLoading={isLoadingBalance}
          />
          <StatusStat />
          <StatItem
            label="Total PnL"
            value={formatStatMoney(totalPnL)}
            valueClassName={
              totalPnL != null && totalPnL > 0 ? "text-[#65AF14]" : undefined
            }
            isLoading={isLoadingPnL}
          />
          <StatItem
            label="Copied Trades"
            value={formatStatCount(totalTrades)}
            isLoading={isLoadingPnL}
          />
        </div>

        <ActionGroup className="mt-5" />
      </UserProfileCard>
      <CreateTradeWalletModal
        open={createWalletOpen}
        onClose={() => setCreateWalletOpen(false)}
      />
    </>
  );
}
