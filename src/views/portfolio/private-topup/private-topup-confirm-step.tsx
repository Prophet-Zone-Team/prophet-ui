"use client";

import { formatShortWallet } from "@/lib/team/detail-format";
import { formatNumber } from "@/utils";
import { depositDetailRowClass } from "@/views/portfolio/deposit/deposit-ui";
import { TokenIcon, WalletAvatarIcon } from "@/views/portfolio/shared/token-icon";
import type { PrivateTopupSelectableToken } from "@/views/portfolio/private-topup/types";
import { privateTopupInfoBannerClass, privateTopupSecureIconWrapClass } from "@/views/portfolio/private-topup/private-topup-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface PrivateTopupConfirmStepProps {
  topupWalletAddress: string;
  ownerWalletAddress: string;
  privateAccountAddress: string;
  token: PrivateTopupSelectableToken;
  tokenAmount: string;
  amountUsd: string;
}

export function PrivateTopupConfirmStep({
  topupWalletAddress,
  ownerWalletAddress,
  privateAccountAddress,
  token,
  tokenAmount,
  amountUsd,
}: PrivateTopupConfirmStepProps) {
  return (
    <div className="flex flex-col gap-4 pb-2">
      <p className="m-0 text-center text-[36px] font-[556] leading-[43px] text-black">
        {formatNumber(amountUsd, 2, true, { prefix: "$", round: 0 })}
      </p>

      <p className={privateTopupInfoBannerClass}>
        Confirm this private account is linked to your Prophet wallet before transferring funds.
      </p>

      <div className="flex flex-col">
        <DetailRow label="Funding Wallet">
          <span className="flex items-center gap-2">
            <WalletAvatarIcon address={topupWalletAddress} />
            <span>{formatShortWallet(topupWalletAddress)}</span>
          </span>
        </DetailRow>
        <DetailRow label="Owner EOA">
          <span>{formatShortWallet(ownerWalletAddress)}</span>
        </DetailRow>
        <DetailRow label="Private Account">
          <span className="flex items-center gap-2">
            <div className={cn(privateTopupSecureIconWrapClass, "!rounded-[6px] !bg-black")}>
              <img
                src="/icons/icon-secure.svg"
                alt=""
                className="size-3 object-contain"
                aria-hidden
              />
            </div>
            <span>{formatShortWallet(privateAccountAddress)}</span>
          </span>
        </DetailRow>
        <DetailRow label="Send">
          <span className="flex items-center gap-2">
            <TokenIcon
              symbol={token.symbol}
              chainLabel={token.chainName}
              icon={token.icon}
              chainIcon={token.chainIcon}
              size="sm"
            />
            <span>{formatNumber(tokenAmount, 4, true, { round: 0 })}</span>
          </span>
        </DetailRow>
        <DetailRow label="Receive">
          <span>Private USDC on Polygon</span>
        </DetailRow>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={depositDetailRowClass}>
      <span className="text-[#909090]">{label}</span>
      <span className="flex-1 border-t border-[#EBEBEB]/60" />
      <span className="font-[556] text-black">{children}</span>
    </div>
  );
}
