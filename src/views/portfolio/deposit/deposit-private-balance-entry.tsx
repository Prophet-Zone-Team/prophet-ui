"use client";

import { ArrowRight, ChevronRight } from "lucide-react";
import Big from "big.js";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import InputNumber from "@/components/input-number";
import { POLYMARKET_USD } from "@/config/funding";
import { cn } from "@/lib/cn";
import { executePrivateBalanceTransfer } from "@/lib/confidential/execute-private-balance-transfer";
import type { ConfidentialAuthStatus } from "@/types/confidential";
import { formatShortWallet } from "@/lib/team/detail-format";
import { formatNumber } from "@/utils";
import {
  depositModalAmountInputClass,
  depositModalAmountInputWrapClass,
  depositPercentButtonClass,
  depositPrivateAccountRowClass,
  depositPrivatePanelDisabledClass,
  depositPrivateTopUpLinkClass,
  depositSectionLabelClass,
  depositTransferBarClass,
} from "@/views/portfolio/deposit/deposit-ui";
import {
  DepositPrivateTransferStatus,
  type DepositPrivateTransferPhase,
} from "@/views/portfolio/deposit/deposit-private-transfer-status";
import type { PrivateAccountStatus } from "@/views/portfolio/deposit/types";
import { fundingPrimaryButtonClass } from "@/views/portfolio/shared/funding-modal-shell";
import { TokenIcon } from "@/views/portfolio/shared/token-icon";

const PERCENT_OPTIONS = [25, 50, 75, 100] as const;

const USDC_TOKEN = POLYMARKET_USD.underlyingToken;

export interface DepositPrivateBalanceEntryProps {
  status: PrivateAccountStatus;
  privateAccountAddress?: string;
  privateBalanceUsd?: number;
  confidentialAuthStatus?: ConfidentialAuthStatus;
  depositWalletDeployed?: boolean;
  ownerWalletAddress?: string;
  funderAddress?: string;
  walletAddress?: string;
  onTopUp?: () => void;
  onTransferComplete?: () => void | Promise<void>;
}

export function DepositPrivateBalanceEntry({
  status,
  privateAccountAddress,
  privateBalanceUsd,
  confidentialAuthStatus,
  depositWalletDeployed = true,
  ownerWalletAddress,
  funderAddress,
  walletAddress,
  onTopUp,
  onTransferComplete,
}: DepositPrivateBalanceEntryProps) {
  const [inputValue, setInputValue] = useState("0");
  const [transferring, setTransferring] = useState(false);
  const [transferPhase, setTransferPhase] = useState<DepositPrivateTransferPhase | null>(null);
  const [transferLabel, setTransferLabel] = useState<string | undefined>();
  const [transferError, setTransferError] = useState<string | undefined>();

  const isAuthenticated = confidentialAuthStatus === "authenticated";
  const isInteractive = status === "funded" && isAuthenticated && depositWalletDeployed;
  const maxBalanceUsd = privateBalanceUsd ?? 0;

  const formattedAccountBalance = useMemo(
    () =>
      formatNumber(privateBalanceUsd ?? 0, 2, true, {
        round: 0,
        isZeroPrecision: true,
      }),
    [privateBalanceUsd],
  );

  const amountWithinBalance = useMemo(() => {
    if (!isInteractive || maxBalanceUsd <= 0) {
      return false;
    }

    try {
      return Big(inputValue || 0).gt(0) && Big(inputValue).lte(maxBalanceUsd);
    } catch {
      return false;
    }
  }, [inputValue, isInteractive, maxBalanceUsd]);

  function handlePercent(percent: number) {
    if (!isInteractive || maxBalanceUsd <= 0) {
      return;
    }

    const nextAmount = Big(maxBalanceUsd).times(percent).div(100);
    setInputValue(nextAmount.toFixed(2, Big.roundDown));
  }

  function resetTransferState() {
    setTransferPhase(null);
    setTransferLabel(undefined);
    setTransferError(undefined);
  }

  const transferEnabled =
    isInteractive &&
    !transferring &&
    Boolean(ownerWalletAddress) &&
    Boolean(walletAddress) &&
    Boolean(funderAddress) &&
    amountWithinBalance;

  async function handleTransfer() {
    if (!transferEnabled || !ownerWalletAddress || !walletAddress) {
      return;
    }

    setTransferring(true);
    setTransferError(undefined);
    setTransferPhase("unshielding");
    setTransferLabel("Unshielding private USDC");

    try {
      await executePrivateBalanceTransfer({
        amountUsd: inputValue,
        ownerWalletAddress,
        tradingWalletAddress: walletAddress,
        onPhaseChange: (phase, label) => {
          setTransferPhase(phase);
          if (label) {
            setTransferLabel(label);
          }
        },
      });

      toast.success("Private balance transferred to Prophet");
      setInputValue("0");
      await onTransferComplete?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setTransferPhase("error");
      setTransferError(message);
      toast.error(message);
    } finally {
      setTransferring(false);
    }
  }

  if (transferPhase) {
    return (
      <DepositPrivateTransferStatus
        phase={transferPhase}
        statusLabel={transferLabel}
        ownerWalletAddress={ownerWalletAddress}
        funderAddress={funderAddress}
        error={transferError}
        onRetry={transferPhase === "error" ? resetTransferState : undefined}
      />
    );
  }

  const sessionHint = !isAuthenticated
    ? "Private account session expired. Return to Prophet and open Private Balance again to sign."
    : !depositWalletDeployed
      ? "Polymarket deposit wallet is not ready yet. Complete wallet setup before transferring."
      : null;

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex items-center justify-between gap-3">
        <span className={depositSectionLabelClass}>Private Account</span>
        {status !== "not_created" ? (
          <button
            type="button"
            className={depositPrivateTopUpLinkClass}
            onClick={() => onTopUp?.()}
          >
            Top up
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className={depositPrivateAccountRowClass}>
        {status === "not_created" ? (
          <span className="flex min-w-0 items-center gap-3">
            <div className="size-[30px] border-[4px] rounded-full border-white bg-[#616161] shadow-[0_0_4px_0px_rgba(0,0,0,0.25)] shrink-0 flex justify-center items-center">
              <img
                src="/icons/icon-secure.svg"
                alt=""
                className="size-[13px] shrink-0 object-center object-contain"
                aria-hidden="true"
              />
            </div>

            <span className="text-base font-[556] text-black">Not Created</span>
          </span>
        ) : (
          <>
            <span className="flex min-w-0 items-center gap-3">
              <span className="relative flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[#616161] ring-2 ring-[#f4f4f4]">
                <img
                  src="/icons/icon-secure.svg"
                  alt=""
                  className="size-3.5 object-contain"
                  aria-hidden="true"
                />
              </span>
              <span className="truncate text-base font-[556] text-black">
                {privateAccountAddress
                  ? formatShortWallet(privateAccountAddress)
                  : "—"}
              </span>
            </span>
            <span className="shrink-0 text-base font-[556] text-black">
              {formattedAccountBalance}
            </span>
          </>
        )}
      </div>

      {sessionHint ? (
        <p className="m-0 text-xs text-[#909090]">{sessionHint}</p>
      ) : null}

      {ownerWalletAddress && funderAddress && isInteractive ? (
        <div className="flex flex-col gap-1 rounded-lg border border-[#EBEBEB] px-3 py-2 text-xs text-[#909090]">
          <p className="m-0">
            Owner EOA: <span className="font-[556] text-black">{formatShortWallet(ownerWalletAddress)}</span>
          </p>
          <p className="m-0">
            Polymarket deposit wallet:{" "}
            <span className="font-[556] text-black">{formatShortWallet(funderAddress)}</span>
          </p>
          <p className="m-0">
            Confirm these addresses before transferring private USDC to Prophet balance.
          </p>
        </div>
      ) : null}

      <div
        className={cn(
          "flex flex-col gap-4 pt-2",
          !isInteractive && depositPrivatePanelDisabledClass,
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <div className={depositModalAmountInputWrapClass}>
            <InputNumber
              prefix="$"
              value={inputValue}
              onNumberChange={setInputValue}
              className={depositModalAmountInputClass}
              aria-label="Private balance transfer amount in USD"
              placeholder="0"
              disabled={!isInteractive}
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PERCENT_OPTIONS.map((percent) => (
              <button
                key={percent}
                type="button"
                className={depositPercentButtonClass}
                onClick={() => handlePercent(percent)}
                disabled={!isInteractive || maxBalanceUsd <= 0}
              >
                {percent}%
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-1 px-4 py-3">
            <span className="text-sm font-[556] text-[#909090]">From</span>
            <span className="text-sm font-[556] text-[#909090]">To</span>
          </div>
          <div className={depositTransferBarClass}>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="relative shrink-0">
                <TokenIcon
                  symbol="USDC"
                  chainLabel="Private"
                  icon={USDC_TOKEN.icon}
                  size="md"
                />
                <img
                  src="/icons/icon-secure.svg"
                  alt=""
                  className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full border border-white bg-[#616161] p-0.5"
                  aria-hidden="true"
                />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-[556] text-black">Private USDC</span>
                <span className="text-xs font-[556] text-[#909090]">Confidential</span>
              </div>
            </div>

            <ArrowRight className="h-4 w-4 shrink-0 text-[#909090]" aria-hidden="true" />

            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              <div className="flex min-w-0 flex-col items-end">
                <span className="text-sm font-[556] text-black">Prophet USDC</span>
                <span className="text-xs font-[556] text-[#909090]">pUSD after convert</span>
              </div>
              <TokenIcon
                symbol="USDC"
                chainLabel={POLYMARKET_USD.chainName}
                icon={POLYMARKET_USD.icon}
                chainIcon={POLYMARKET_USD.chainIcon}
                size="md"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          className={cn(
            fundingPrimaryButtonClass,
            !transferEnabled && "opacity-30",
          )}
          disabled={!transferEnabled}
          onClick={() => void handleTransfer()}
        >
          Transfer
        </button>
      </div>
    </div>
  );
}
