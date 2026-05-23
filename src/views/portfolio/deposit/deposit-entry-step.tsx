"use client";

import { formatPortfolioMoney } from "@/lib/portfolio/portfolio-format";
import { formatShortWallet } from "@/lib/team/detail-format";
import { MOCK_CONNECTED_BALANCE_USD } from "@/views/portfolio/deposit/config";
import {
  depositConnectedRowClass,
  depositSectionLabelClass
} from "@/views/portfolio/deposit/deposit-ui";
import { WalletAvatarIcon } from "@/views/portfolio/shared/token-icon";

export interface DepositEntryStepProps {
  walletAddress: string;
  onSelectConnected: () => void;
}

export function DepositEntryStep({
  walletAddress,
  onSelectConnected
}: DepositEntryStepProps) {
  return (
    <div className="flex flex-col gap-3 pb-2">
      <span className={depositSectionLabelClass}>Connected</span>
      <button
        type="button"
        className={depositConnectedRowClass}
        onClick={onSelectConnected}
      >
        <span className="flex min-w-0 items-center gap-3">
          <WalletAvatarIcon />
          <span className="truncate text-base font-[556] text-black">
            {formatShortWallet(walletAddress)}
          </span>
        </span>
        <span className="shrink-0 text-base font-[556] text-black">
          {formatPortfolioMoney(MOCK_CONNECTED_BALANCE_USD)}
        </span>
      </button>
    </div>
  );
}
