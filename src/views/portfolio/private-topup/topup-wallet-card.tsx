"use client";

import { useTranslations } from "next-intl";

import { CopyButton } from "@/components/feedback/copy-button";
import { CopyIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { formatShortWallet } from "@/lib/team/detail-format";
import { formatNumber } from "@/utils";
import { WalletAvatarIcon } from "@/views/portfolio/shared/token-icon";
import {
  privateTopupChangeLinkClass,
  privateTopupPrimaryButtonClass,
  privateTopupSectionLabelClass,
  privateTopupWalletCardClass,
  privateTopupBalanceLargeClass,
} from "@/views/portfolio/private-topup/private-topup-ui";
import type { FundingWalletChainType } from "@/store/use-funding-wallet-store";

export interface TopupWalletCardProps {
  connected: boolean;
  address?: string;
  chainType?: FundingWalletChainType;
  balanceUsd: number;
  balanceLoading?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function TopupWalletCard({
  connected,
  address,
  chainType,
  balanceUsd,
  balanceLoading = false,
  onConnect,
  onDisconnect,
}: TopupWalletCardProps) {
  const t = useTranslations("privateTopup");
  const tWallet = useTranslations("wallet");

  return (
    <div className={privateTopupWalletCardClass}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          {connected && address ? (
            <WalletAvatarIcon address={address} className="size-[50px]" />
          ) : (
            <div
              className="size-[50px] shrink-0 rounded-full bg-prophet-panel"
              aria-hidden
            />
          )}
          <div className="min-w-0 flex-1">
            <p className={`m-0 ${privateTopupSectionLabelClass}`}>
              {t("fundingWallet")}
              {chainType ? (
                <span className="ml-2 text-prophet-muted">
                  {t(`fundingChain.${chainType === "evm" ? "evm" : chainType}`)}
                </span>
              ) : null}
            </p>
            {connected && address ? (
              <div className="mt-1 flex items-center gap-2">
                <p className="m-0 truncate text-lg font-[500] text-prophet-foreground">
                  {formatShortWallet(address)}
                </p>
                <CopyButton
                  text={address}
                  ariaLabel={t("copyWalletAddress")}
                  className="inline-flex shrink-0 items-center justify-center border-0 bg-transparent p-0 text-prophet-muted transition-colors hover:text-prophet-foreground"
                >
                  <CopyIcon />
                </CopyButton>
              </div>
            ) : (
              <p className="m-0 mt-1 text-lg font-[500] text-prophet-foreground">-</p>
            )}
          </div>
        </div>
        {connected ? (
          <button
            type="button"
            className={privateTopupChangeLinkClass}
            onClick={onDisconnect}
          >
            {t("change")}
          </button>
        ) : null}
      </div>

      <img
        src="/icons/icon-right-multi.svg"
        alt=""
        className="pointer-events-none absolute right-6 top-1/2 h-5 w-9 -translate-y-1/2 object-contain"
        aria-hidden
      />

      {connected ? (
        <div className="mt-auto pt-8">
          <p className={`m-0 ${privateTopupSectionLabelClass}`}>
            {tWallet("balance")}
          </p>
          <p className={cn("m-0 mt-2", privateTopupBalanceLargeClass)}>
            {balanceLoading
              ? "…"
              : formatNumber(balanceUsd, 2, true, {
                  prefix: "$",
                  round: 0,
                  isZeroPrecision: true
                })}
          </p>
        </div>
      ) : (
        <button
          type="button"
          className={cn(privateTopupPrimaryButtonClass, "mt-auto")}
          onClick={onConnect}
        >
          {t("connectFundingWallet")}
        </button>
      )}
    </div>
  );
}
