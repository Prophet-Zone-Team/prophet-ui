"use client";

import { cn } from "@/lib/cn";
import { MOCK_DEPOSIT_TOKENS } from "@/views/portfolio/deposit/config";
import {
  depositTokenRowClass,
  depositTokenRowDisabledClass,
  depositTokenRowSelectedClass
} from "@/views/portfolio/deposit/deposit-ui";
import type { DepositTokenOption } from "@/views/portfolio/deposit/types";
import {
  formatTokenBalance,
  formatTokenBalanceUsd
} from "@/views/portfolio/deposit/utils";
import { TokenIcon } from "@/views/portfolio/shared/token-icon";

export interface DepositTokenStepProps {
  selectedTokenId: string | undefined;
  onSelectToken: (token: DepositTokenOption) => void;
}

export function DepositTokenStep({
  selectedTokenId,
  onSelectToken
}: DepositTokenStepProps) {
  return (
    <div className="flex max-h-[340px] flex-col gap-0.5 overflow-y-auto pb-2">
      {MOCK_DEPOSIT_TOKENS.map((token) => {
        const isSelected = selectedTokenId === token.id;
        const isDisabled = Boolean(token.unsupported);

        return (
          <button
            key={token.id}
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
              chainLabel={token.chainLabel}
              dimmed={isDisabled}
            />
            <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
              <span className="text-sm font-[556] text-black">{token.symbol}</span>
              <span className="text-xs font-[556] text-[#909090]">
                {formatTokenBalance(token.balance, token.symbol)}
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-0.5">
              {token.unsupported ? (
                <span className="text-sm font-[556] text-[#909090]">Unsupported</span>
              ) : null}
              <span className="text-sm font-[556] text-black">
                {formatTokenBalanceUsd(token.balanceUsd)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
