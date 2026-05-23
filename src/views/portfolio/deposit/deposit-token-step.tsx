"use client";

import { cn } from "@/lib/cn";
import {
  depositTokenRowClass,
  depositTokenRowDisabledClass,
  depositTokenRowSelectedClass
} from "@/views/portfolio/deposit/deposit-ui";
import { TokenIcon } from "@/views/portfolio/shared/token-icon";
import { usePortfolioContext } from "../context";
import { useDepositContext } from "./context";
import { FundingAsset } from "@/config/funding";
import { formatNumber } from "@/utils";

export interface DepositTokenStepProps {
  selectedToken?: FundingAsset;
  onSelectToken: (token: FundingAsset) => void;
}

export function DepositTokenStep({
  selectedToken,
  onSelectToken
}: DepositTokenStepProps) {
  const {
    session,
  } = usePortfolioContext();
  const { supportedAssets } = useDepositContext();

  return (
    <div className="flex max-h-[340px] flex-col gap-0.5 overflow-y-auto pb-2">
      {supportedAssets.map((token) => {
        const isSelected = selectedToken?.chainId === token.chainId && selectedToken?.address === token.address;
        const isDisabled = false;

        return (
          <button
            key={`${token.chainId}-${token.address}`}
            type="button"
            disabled={isDisabled}
            className={cn(
              depositTokenRowClass,
              isSelected && depositTokenRowSelectedClass,
              isDisabled && depositTokenRowDisabledClass
            )}
            onClick={() => {
              if (!isDisabled) {
                onSelectToken(token);
              }
            }}
          >
            <TokenIcon
              symbol={token.symbol}
              chainLabel={token.chainName}
              icon={token.icon}
              chainIcon={token.chainIcon}
              dimmed={isDisabled}
            />
            <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
              <span className="text-sm font-[556] text-black">{token.symbol}</span>
              <span className="text-xs font-[556] text-[#909090]">
                {formatNumber(0, 2, true, { round: 0, isZeroPrecision: true })}
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-0.5">
              {isDisabled ? (
                <span className="text-sm font-[556] text-[#909090]">Unsupported</span>
              ) : null}
              <span className="text-sm font-[556] text-black">
                {formatNumber(0, 2, true, { prefix: "$", round: 0, isZeroPrecision: true })}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
