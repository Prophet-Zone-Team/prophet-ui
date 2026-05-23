"use client";

import { formatPortfolioMoney } from "@/lib/portfolio/portfolio-format";
import { formatShortWallet } from "@/lib/team/detail-format";
import { MOCK_CONNECTED_BALANCE_USD } from "@/views/portfolio/deposit/config";
import {
  depositConnectedRowClass,
  depositSectionLabelClass
} from "@/views/portfolio/deposit/deposit-ui";
import { WalletAvatarIcon } from "@/views/portfolio/shared/token-icon";
import { usePortfolioContext } from "../context";

export interface DepositEntryStepProps {
  onSelectConnected: () => void;
}

export function DepositEntryStep({
  onSelectConnected
}: DepositEntryStepProps) {
  const {
    session,
    onConnectWallet,
    status,
  } = usePortfolioContext();

  if (!session) {
    return (
      <div className="flex justify-center gap-3 pb-2 pt-[120px]">
        <button
          type="button"
          className="bg-black text-white flex justify-center items-center w-60 h-10 text-base rounded-lg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => void onConnectWallet()}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Connecting…" : "Connect Wallet"}
        </button>
      </div>
    );
  }

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
            {formatShortWallet(session.walletAddress)}
          </span>
        </span>
        <span className="shrink-0 text-base font-[556] text-black">
          {formatPortfolioMoney(MOCK_CONNECTED_BALANCE_USD)}
        </span>
      </button>
    </div>
  );
}
