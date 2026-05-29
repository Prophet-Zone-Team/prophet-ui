"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Big from "big.js";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { FUNDING_NETWORKS } from "@/config/funding";
import { ensureFundingEvmChain } from "@/lib/funding/ensure-funding-evm-chain";
import { selectFundingTokenBalanceString } from "@/lib/funding/balance-selectors";
import { transferCollateralFromConnectedWallet } from "@/lib/trading/polygon-collateral-transfer";
import { privateFundingWagmiConfig } from "@/context/private-funding-wallet/wagmi-config";
import {
  createShieldQuote,
  fetchShieldStatus,
  generateShieldIntent,
  pollConfidentialStatus,
  prepareConfidentialSignedData,
  signConfidentialIntentPayload,
  submitShieldIntent,
} from "@/lib/confidential/client";
import { useBalancesStore } from "@/store/use-balances";
import { PRIVATE_TOPUP_MODAL_WIDTH } from "@/views/portfolio/private-topup/config";
import { PrivateTopupProvider } from "@/views/portfolio/private-topup/context";
import {
  PrivateTopupAmountStep,
  isPrivateTopupAmountStepValid,
} from "@/views/portfolio/private-topup/private-topup-amount-step";
import { PrivateTopupConfirmStep } from "@/views/portfolio/private-topup/private-topup-confirm-step";
import { PrivateTopupTokenStep } from "@/views/portfolio/private-topup/private-topup-token-step";
import type {
  PrivateTopupAmountState,
  PrivateTopupSelectableToken,
  PrivateTopupStatusPhase,
  PrivateTopupStep,
  PrivateShieldExecutionContext,
} from "@/views/portfolio/private-topup/types";
import {
  FundingModalShell,
  fundingPrimaryButtonClass,
} from "@/views/portfolio/shared/funding-modal-shell";
import { FundingResponsiveOverlay } from "@/views/portfolio/shared/funding-responsive-overlay";
const POLYGON_USDC_TOKEN: PrivateTopupSelectableToken = {
  ...FUNDING_NETWORKS.polygon,
  assetId: "polygon-usdc",
  blockchain: "pol",
  symbol: "USDC",
  name: "USDC",
  address: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
  decimals: 6,
  icon: "/tokens/usdc.png",
  minCheckoutUsd: 0,
  price: 1,
  chainName: FUNDING_NETWORKS.polygon.chainName,
  chainIcon: FUNDING_NETWORKS.polygon.chainIcon,
};

const INITIAL_STEP: PrivateTopupStep = "amount";
const INITIAL_AMOUNT: PrivateTopupAmountState = { amountUsd: "0", tokenAmount: "0" };

export interface PrivateTopupDialogProps {
  open: boolean;
  topupWalletAddress: string;
  ownerWalletAddress: string;
  privateAccountAddress: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PrivateTopupDialog({
  open,
  topupWalletAddress,
  ownerWalletAddress,
  privateAccountAddress,
  onClose,
  onSuccess,
}: PrivateTopupDialogProps) {
  const [step, setStep] = useState<PrivateTopupStep>(INITIAL_STEP);
  const [amount, setAmount] = useState<PrivateTopupAmountState>(INITIAL_AMOUNT);
  const [continueLoading, setContinueLoading] = useState(false);
  const [statusPhase, setStatusPhase] = useState<PrivateTopupStatusPhase>("preparing");
  const [statusLabel, setStatusLabel] = useState<string | undefined>();
  const [statusError, setStatusError] = useState<string | undefined>();
  const [shieldExecution, setShieldExecution] = useState<PrivateShieldExecutionContext | undefined>();
  const [quotePayload, setQuotePayload] = useState<Awaited<ReturnType<typeof createShieldQuote>> | undefined>();

  const evmBalances = useBalancesStore((state) => state.evmBalances);

  const selectedToken = POLYGON_USDC_TOKEN;
  const selectedTokenMaxAmount = useMemo(
    () => selectFundingTokenBalanceString(evmBalances, selectedToken),
    [evmBalances],
  );

  const reset = useCallback(() => {
    setStep(INITIAL_STEP);
    setAmount(INITIAL_AMOUNT);
    setContinueLoading(false);
    setStatusPhase("preparing");
    setStatusLabel(undefined);
    setStatusError(undefined);
    setShieldExecution(undefined);
    setQuotePayload(undefined);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onContinueToConfirm = async () => {
    setContinueLoading(true);

    try {
      const amountBaseUnits = Big(amount.tokenAmount)
        .times(10 ** selectedToken.decimals)
        .toFixed(0, 0);
      const quote = await createShieldQuote(amountBaseUnits);
      setQuotePayload(quote);
      setStep("confirm");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    } finally {
      setContinueLoading(false);
    }
  };

  const onConfirmTopup = async () => {
    if (!quotePayload?.depositAddress) {
      toast.error("Private top up is not ready. Try again.");
      return;
    }

    setContinueLoading(true);
    setStatusError(undefined);
    setStep("status");
    setStatusPhase("transferring");
    setStatusLabel("Waiting for funding transfer");

    try {
      await ensureFundingEvmChain(topupWalletAddress, selectedToken.chainId);

      const { txHash } = await transferCollateralFromConnectedWallet({
        walletAddress: topupWalletAddress,
        tokenAddress: selectedToken.address,
        toAddress: quotePayload.depositAddress,
        amountUsd: amount.tokenAmount,
        tokenDecimals: selectedToken.decimals,
        chainId: selectedToken.chainId,
        wagmiConfig: privateFundingWagmiConfig,
      });

      setShieldExecution({
        depositAddress: quotePayload.depositAddress,
        depositMemo: quotePayload.depositMemo,
        txHash,
      });

      setStatusPhase("signing");
      setStatusLabel("Waiting for owner signature");

      const intentPayload = await generateShieldIntent(quotePayload.depositAddress);
      const signature = await signConfidentialIntentPayload(ownerWalletAddress, intentPayload.intent);
      const signedData = prepareConfidentialSignedData(signature, ownerWalletAddress);

      setStatusPhase("shielding");
      setStatusLabel("Shielding funds");

      await submitShieldIntent(quotePayload.depositAddress, signedData);

      await pollConfidentialStatus(fetchShieldStatus, quotePayload.depositAddress, quotePayload.depositMemo);

      setStatusPhase("success");
      setStatusLabel("Top up successful");
      toast.success("Top up successful");
      handleClose();
      await onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusPhase("error");
      setStatusError(message);
      toast.error(message);
    } finally {
      setContinueLoading(false);
    }
  };

  const footer = useMemo(() => {
    if (step === "status") {
      return undefined;
    }

    if (step === "amount") {
      const canContinue = isPrivateTopupAmountStepValid(amount.tokenAmount, selectedTokenMaxAmount);

      return (
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          disabled={!canContinue || continueLoading}
          onClick={() => void onContinueToConfirm()}
        >
          {continueLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continue
        </button>
      );
    }

    if (step === "confirm") {
      return (
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          disabled={continueLoading || !quotePayload}
          onClick={() => void onConfirmTopup()}
        >
          {continueLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirm
        </button>
      );
    }

    return undefined;
  }, [amount.tokenAmount, continueLoading, onConfirmTopup, quotePayload, selectedTokenMaxAmount, step]);

  const ariaLabel =
    step === "amount"
      ? "Enter top up amount"
      : step === "confirm"
        ? "Confirm private top up"
        : "Top up status";

  return (
    <FundingResponsiveOverlay
      open={open}
      onClose={handleClose}
      ariaLabel={ariaLabel}
      className={PRIVATE_TOPUP_MODAL_WIDTH}
      hideCloseButton
      overlayCloseable={false}
    >
      <PrivateTopupProvider
        value={{
          selectableTokens: [selectedToken],
          topupWalletAddress,
          ownerWalletAddress,
          privateAccountAddress,
          privateBalanceUsd: 0,
          balancesLoading: false,
          pricesLoading: false,
          topupWalletBalanceUsd: 0,
        }}
      >
        <FundingModalShell
          title="Top up Private Balance"
          onClose={handleClose}
          onBack={step === "confirm" ? () => setStep("amount") : undefined}
          footer={footer}
          className="min-h-0 md:min-h-[480px]"
        >
          {step === "amount" ? (
            <PrivateTopupAmountStep
              token={selectedToken}
              amount={amount}
              maxAmount={selectedTokenMaxAmount}
              onAmountChange={setAmount}
            />
          ) : null}

          {step === "confirm" ? (
            <PrivateTopupConfirmStep
              topupWalletAddress={topupWalletAddress}
              ownerWalletAddress={ownerWalletAddress}
              privateAccountAddress={privateAccountAddress}
              token={selectedToken}
              tokenAmount={amount.tokenAmount}
              amountUsd={amount.amountUsd}
            />
          ) : null}

          {step === "status" ? (
            <div className="flex flex-col items-center gap-4 px-4 py-10 text-center">
              {continueLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-[#909090]" aria-hidden />
              ) : null}
              <p className="m-0 text-base font-[556] text-black">
                {statusPhase === "success" ? "Top up complete" : "Processing private top up"}
              </p>
              {statusLabel ? (
                <p className="m-0 text-sm text-[#909090]">{statusLabel}</p>
              ) : null}
              {shieldExecution?.txHash ? (
                <p className="m-0 break-all text-xs text-[#909090]">{shieldExecution.txHash}</p>
              ) : null}
              {statusError ? (
                <p className="m-0 text-sm text-prophet-red">{statusError}</p>
              ) : null}
            </div>
          ) : null}
        </FundingModalShell>
      </PrivateTopupProvider>
    </FundingResponsiveOverlay>
  );
}
