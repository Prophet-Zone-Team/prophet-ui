"use client";

import { ArrowRight, ChevronRight, Loader2 } from "lucide-react";
import Big from "big.js";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import InputNumber from "@/components/input-number";
import { POLYMARKET_USD } from "@/config/funding";
import { cn } from "@/lib/cn";
import { formatShortWallet } from "@/lib/team/detail-format";
import { formatNumber } from "@/utils";
import {
  useConfidentialUnshield,
  type UnshieldPhase,
} from "@/hooks/confidential/use-confidential-unshield";
import {
  depositModalAmountInputClass,
  depositModalAmountInputWrapClass,
  depositPercentButtonClass,
  depositPrivateAccountRowClass,
  depositPrivatePanelDisabledClass,
  depositPrivateTopUpLinkClass,
  depositSectionLabelClass,
  depositTransferBarClass
} from "@/views/portfolio/deposit/deposit-ui";
import type { PrivateAccountStatus } from "@/views/portfolio/deposit/types";
import { fundingPrimaryButtonClass } from "@/views/portfolio/shared/funding-modal-shell";
import { TokenIcon } from "@/views/portfolio/shared/token-icon";
import { useAuth } from "@/context/auth";

const PERCENT_OPTIONS = [25, 50, 75, 100] as const;

const USDC_TOKEN = POLYMARKET_USD.underlyingToken;

export interface DepositPrivateBalanceEntryProps {
  status: PrivateAccountStatus;
  privateAccountAddress?: string;
  privateAccountEoaAddress?: string;
  privateBalanceUsd?: number;
  walletAddress?: string;
  onTopUp?: () => void;
}

export function DepositPrivateBalanceEntry({
  status,
  privateAccountAddress,
  privateAccountEoaAddress,
  privateBalanceUsd,
  walletAddress,
  onTopUp,
}: DepositPrivateBalanceEntryProps) {
  const tDeposit = useTranslations("portfolio.deposit");
  const tPrivateTopup = useTranslations("privateTopup");
  const [inputValue, setInputValue] = useState("0");
  const [phase, setPhase] = useState<UnshieldPhase>("idle");
  const { unshield } = useConfidentialUnshield();
  const { syncCash, refreshPrivateBalance } = useAuth();

  const isInteractive = status === "funded";
  const maxBalanceUsd = privateBalanceUsd ?? 0;
  const transferring = phase !== "idle" && phase !== "success" && phase !== "error";

  const unshieldPhaseLabel = useMemo(() => {
    const labels: Partial<Record<UnshieldPhase, string>> = {
      quoting: tDeposit("unshieldQuoting"),
      signing: tDeposit("unshieldSigning"),
      submitting: tDeposit("unshieldSubmitting"),
      awaiting_funds: tDeposit("unshieldAwaitingFunds"),
      converting: tDeposit("unshieldConverting"),
    };
    return labels[phase] ?? "";
  }, [phase, tDeposit]);

  const formattedAccountBalance = useMemo(
    () =>
      formatNumber(privateBalanceUsd ?? 0, 2, true, {
        round: 0,
        isZeroPrecision: true,
      }),
    [privateBalanceUsd]
  );

  function handlePercent(percent: number) {
    if (!isInteractive || maxBalanceUsd <= 0) {
      return;
    }

    const nextAmount = Big(maxBalanceUsd).times(percent).div(100);
    setInputValue(nextAmount.toFixed(6, Big.roundDown));
  }

  const transferEnabled =
    isInteractive &&
    Big(inputValue || 0).gt(0) &&
    Big(inputValue || 0).lte(maxBalanceUsd) &&
    maxBalanceUsd > 0 &&
    Boolean(walletAddress) &&
    !transferring;

  async function handleTransfer() {
    if (!transferEnabled || !walletAddress) {
      return;
    }

    try {
      await unshield({
        amountUsd: inputValue,
        eoaAddress: walletAddress,
        onPhase: setPhase,
      });
      toast.success(tDeposit("transferComplete"));
      setInputValue("0");
      try {
        await Promise.all([refreshPrivateBalance(), syncCash()]);
      } catch (refreshError) {
        console.warn(
          "[deposit-private-balance-entry] refresh after transfer failed",
          refreshError,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    } finally {
      setPhase("idle");
    }
  }

  useEffect(() => {
    refreshPrivateBalance();
  }, []);

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex items-center justify-between gap-3">
        <span className={depositSectionLabelClass}>{tPrivateTopup("privateAccount")}</span>
        {status !== "not_created" ? (
          <button
            type="button"
            className={depositPrivateTopUpLinkClass}
            onClick={() => onTopUp?.()}
          >
            {tPrivateTopup("topUp")}
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

            <span className="text-base font-[500] text-black">{tDeposit("notCreated")}</span>
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
              <span className="truncate text-base font-[500] text-black">
                {privateAccountAddress
                  ? formatShortWallet(privateAccountAddress)
                  : "—"}
              </span>
            </span>
            <span className="shrink-0 text-base font-[500] text-black">
              {formattedAccountBalance}
            </span>
          </>
        )}
      </div>

      <div
        className={cn(
          "flex flex-col gap-4 pt-2",
          !isInteractive && depositPrivatePanelDisabledClass
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <div className={depositModalAmountInputWrapClass}>
            <InputNumber
              prefix="$"
              value={inputValue}
              onNumberChange={setInputValue}
              className={depositModalAmountInputClass}
              aria-label={tDeposit("privateTransferAmountAria")}
              placeholder="0"
              disabled={!isInteractive}
              decimals={6}
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
            <span className="text-sm font-[500] text-[#909090]">{tDeposit("from")}</span>
            <span className="text-sm font-[500] text-[#909090]">{tDeposit("to")}</span>
          </div>
          <div className={depositTransferBarClass}>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="relative shrink-0">
                <TokenIcon
                  symbol="USDC"
                  chainLabel={tDeposit("privateLabel")}
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
                <span className="text-sm font-[500] text-black">USDC</span>
                <span className="text-xs font-[500] text-[#909090]">
                  {tDeposit("privateLabel")}
                </span>
              </div>
            </div>

            <ArrowRight
              className="h-4 w-4 shrink-0 text-[#909090]"
              aria-hidden="true"
            />

            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              <div className="flex min-w-0 flex-col items-end">
                <span className="text-sm font-[500] text-black">USDC</span>
                <span className="text-xs font-[500] text-[#909090]">
                  {tDeposit("prophetLabel")}
                </span>
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

        {isInteractive && privateAccountEoaAddress ? (
          <p className="m-0 text-center text-xs font-[400] text-[#909090]">
            {tDeposit("linkedTo", {
              address: formatShortWallet(privateAccountEoaAddress),
            })}
          </p>
        ) : null}

        <button
          type="button"
          className={cn(
            fundingPrimaryButtonClass,
            !transferEnabled && "opacity-30"
          )}
          disabled={!transferEnabled}
          onClick={() => void handleTransfer()}
        >
          {transferring ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              {unshieldPhaseLabel || tDeposit("transferring")}
            </>
          ) : (
            tDeposit("transfer")
          )}
        </button>
      </div>
    </div>
  );
}
