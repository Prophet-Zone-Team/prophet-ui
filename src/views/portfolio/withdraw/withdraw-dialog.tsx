"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { Modal } from "@/components/ui/modal";
import { formatShortWallet } from "@/lib/team/detail-format";
import { TransactionBreakdown } from "@/views/portfolio/deposit/transaction-breakdown";
import {
  MOCK_WITHDRAW_MAX_AMOUNT,
  WITHDRAW_CHAIN_OPTIONS,
  WITHDRAW_MODAL_WIDTH,
  WITHDRAW_SOURCE_TOKEN_LABEL,
  WITHDRAW_TOKEN_OPTIONS
} from "@/views/portfolio/withdraw/config";
import type { WithdrawChainOption, WithdrawTokenOption } from "@/views/portfolio/withdraw/types";
import {
  formatWithdrawEstimate,
  parseWithdrawAmount,
  validateWithdrawAmount
} from "@/views/portfolio/withdraw/utils";
import {
  withdrawAmountInputClass,
  withdrawFieldLabelClass,
  withdrawInputBoxClass,
  withdrawMaxButtonClass,
  withdrawSelectorBoxClass
} from "@/views/portfolio/withdraw/withdraw-ui";
import {
  FundingModalShell,
  fundingPrimaryButtonClass
} from "@/views/portfolio/shared/funding-modal-shell";
import { TokenIcon, WalletAvatarIcon } from "@/views/portfolio/shared/token-icon";
import type { TradingUserSession } from "@/types/market";

export interface WithdrawDialogProps {
  open: boolean;
  onClose: () => void;
  session: TradingUserSession;
}

export function WithdrawDialog({ open, onClose, session }: WithdrawDialogProps) {
  const [amountInput, setAmountInput] = useState("");
  const [selectedChain, setSelectedChain] = useState<WithdrawChainOption>(
    WITHDRAW_CHAIN_OPTIONS[0]
  );
  const [selectedToken, setSelectedToken] = useState<WithdrawTokenOption>(
    WITHDRAW_TOKEN_OPTIONS[0]
  );

  const amount = parseWithdrawAmount(amountInput);
  const validationError = validateWithdrawAmount(amount, MOCK_WITHDRAW_MAX_AMOUNT);
  const canSubmit = validationError === undefined;

  const estimate = useMemo(
    () => formatWithdrawEstimate(amount ?? 0, selectedToken.symbol),
    [amount, selectedToken.symbol]
  );

  function handleClose() {
    setAmountInput("");
    onClose();
  }

  function handleMax() {
    setAmountInput(String(MOCK_WITHDRAW_MAX_AMOUNT));
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      ariaLabel="Withdraw funds"
      className={WITHDRAW_MODAL_WIDTH}
      hideCloseButton
    >
      <FundingModalShell
        title="Withdraw"
        onClose={handleClose}
        className="min-h-[680px]"
        footer={
          <button
            type="button"
            className={fundingPrimaryButtonClass}
            disabled={!canSubmit}
            onClick={handleClose}
          >
            Withdraw
          </button>
        }
      >
        <div className="flex flex-col gap-5 pb-2">
          <div className="flex flex-col gap-2">
            <span className={withdrawFieldLabelClass}>Recipient Address</span>
            <div className={withdrawInputBoxClass}>
              <span className="flex min-w-0 items-center gap-2">
                <WalletAvatarIcon />
                <span className="truncate text-base font-[556] text-black">
                  {formatShortWallet(session.walletAddress)}
                </span>
              </span>
              <span className="shrink-0 text-base font-[556] text-[#909090]">Connected</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className={withdrawFieldLabelClass}>Amount</span>
            <div className={withdrawInputBoxClass}>
              <input
                type="text"
                inputMode="decimal"
                value={amountInput}
                onChange={(event) => setAmountInput(event.target.value)}
                className={withdrawAmountInputClass}
                placeholder="0"
                aria-label="Withdraw amount"
              />
              <span className="flex shrink-0 items-center gap-3">
                <span className="text-base font-[556] text-[#909090]">
                  {WITHDRAW_SOURCE_TOKEN_LABEL}
                </span>
                <button
                  type="button"
                  className={withdrawMaxButtonClass}
                  onClick={handleMax}
                >
                  Max
                </button>
              </span>
            </div>
            {validationError && amountInput.trim() ? (
              <p className="m-0 text-sm text-prophet-red">{validationError}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectorField
              label="Receive Chain"
              value={selectedChain.label}
              icon={
                <TokenIcon symbol="USDC" chainLabel={selectedChain.label} size="sm" />
              }
              onClick={() => {
                const index = WITHDRAW_CHAIN_OPTIONS.findIndex(
                  (item) => item.id === selectedChain.id
                );
                const next =
                  WITHDRAW_CHAIN_OPTIONS[(index + 1) % WITHDRAW_CHAIN_OPTIONS.length];
                setSelectedChain(next);
              }}
            />
            <SelectorField
              label="Receive Token"
              value={selectedToken.symbol}
              icon={<TokenIcon symbol={selectedToken.symbol} size="sm" />}
              onClick={() => {
                const index = WITHDRAW_TOKEN_OPTIONS.findIndex(
                  (item) => item.id === selectedToken.id
                );
                const next =
                  WITHDRAW_TOKEN_OPTIONS[(index + 1) % WITHDRAW_TOKEN_OPTIONS.length];
                setSelectedToken(next);
              }}
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <span className={withdrawFieldLabelClass}>Est. Receive</span>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-base font-[556] text-black">{estimate.receiveLabel}</span>
              <span className="text-base font-[556] text-[#909090]">{estimate.fiatLabel}</span>
            </div>
          </div>

          <TransactionBreakdown />
        </div>
      </FundingModalShell>
    </Modal>
  );
}

function SelectorField({
  label,
  value,
  icon,
  onClick
}: {
  label: string;
  value: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className={withdrawFieldLabelClass}>{label}</span>
      <button type="button" className={withdrawSelectorBoxClass} onClick={onClick}>
        <span className="flex items-center gap-2">
          {icon}
          <span className="text-base font-[556] text-black">{value}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#909090]" aria-hidden="true" />
      </button>
    </div>
  );
}
