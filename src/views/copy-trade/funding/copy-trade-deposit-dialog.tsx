"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { FundingAsset } from "@/config/funding";
import { useCopyTradeDeposit } from "@/hooks/copy-trade/use-copy-trade-deposit";
import type { CopyDepositChainOption } from "@/lib/copy-trade/deposit-assets";
import { formatNumber } from "@/utils";
import {
  FundingModalShell,
  fundingPrimaryButtonClass,
} from "@/views/portfolio/shared/funding-modal-shell";
import { FundingResponsiveOverlay } from "@/views/portfolio/shared/funding-responsive-overlay";
import { DepositAddressStep } from "@/views/copy-trade/funding/deposit-address-step";
import { DepositAssetStep } from "@/views/copy-trade/funding/deposit-asset-step";
import { DepositConnectedStep } from "@/views/copy-trade/funding/deposit-connected-step";
import { DepositStatusStep } from "@/views/copy-trade/funding/deposit-status-step";
import type { CopyDepositStep } from "@/views/copy-trade/funding/types";
import { DEFAULT_DEPOSIT_ASSET, POLYGON_NETWORK } from "@/lib/market/deposit-assets";

export interface CopyTradeDepositDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CopyTradeDepositDialog({
  open,
  onClose,
}: CopyTradeDepositDialogProps) {
  const handleCredited = useCallback((credited: number) => {
    toast.success(`Deposit credited: ${formatNumber(credited, 2)} pUSD`);
  }, []);

  const deposit = useCopyTradeDeposit({
    open,
    onCredited: handleCredited,
  });

  const [step, setStep] = useState<CopyDepositStep>("asset");
  const [selectedChain, setSelectedChain] =
    useState<CopyDepositChainOption | null>(null);
  const [selectedToken, setSelectedToken] = useState<FundingAsset | null>(null);
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | undefined>();

  const tokensForChain = useMemo(
    () =>
      selectedChain ? deposit.getTokensForChain(selectedChain.chainId) : [],
    [deposit, selectedChain],
  );

  // Reset internal state whenever the dialog opens.
  useEffect(() => {
    if (!open) {
      return;
    }
    setStep("asset");
    setAmount("");
    setTxHash("");
    setErrorText(undefined);
  }, [open]);

  // Default the chain/token selection once supported assets are available.
  useEffect(() => {
    if (deposit.isSocialLogin) {
      return;
    }
    if (!selectedChain && deposit.chainOptions.length > 0) {
      const defaultSelectedChain = deposit.chainOptions.find((chain) => chain.chainId === POLYGON_NETWORK.chainId) ?? deposit.chainOptions[0];
      setSelectedChain(defaultSelectedChain);
    }
  }, [deposit.chainOptions, deposit.isSocialLogin, selectedChain]);

  useEffect(() => {
    if (deposit.isSocialLogin || !selectedChain) {
      return;
    }
    const exists =
      selectedToken &&
      tokensForChain.some(
        (token) =>
          token.address === selectedToken.address &&
          token.chainId === selectedToken.chainId,
      );
    if (!exists) {
      const defaultSelectedToken = tokensForChain.find((token) => token.symbol === DEFAULT_DEPOSIT_ASSET.symbol) ?? tokensForChain[0];
      setSelectedToken(defaultSelectedToken);
    }
  }, [deposit.isSocialLogin, selectedChain, selectedToken, tokensForChain]);

  const validateAmount = (): string | undefined => {
    if (!selectedToken) {
      return "Select a token to deposit.";
    }
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return "Enter a valid amount.";
    }
    const balance = Number(deposit.resolveTokenBalance(selectedToken));
    if (value > balance) {
      return "Amount exceeds your wallet balance.";
    }
    if (value < selectedToken.minCheckoutUsd) {
      return `Minimum deposit is $${formatNumber(
        selectedToken.minCheckoutUsd,
        2,
      )}.`;
    }
    return undefined;
  };

  const handleContinue = () => {
    const validationError = validateAmount();
    if (validationError) {
      setErrorText(validationError);
      return;
    }
    setErrorText(undefined);
    setStep("confirm");
  };

  const handleConfirmTransfer = async () => {
    if (!selectedToken) {
      return;
    }
    setSubmitting(true);
    setErrorText(undefined);
    try {
      const hash = await deposit.transferDeposit(amount, selectedToken);
      setTxHash(hash);
      setStep("status");
      toast.success("Transfer submitted");
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  };

  const renderBody = () => {
    if (!deposit.walletReady) {
      return (
        <p className="py-8 text-center text-sm text-[#909090]">
          Your copy wallet is being set up. Deposits will be available once it is
          ready.
        </p>
      );
    }

    if (deposit.isSocialLogin) {
      return (
        <DepositAddressStep
          address={deposit.evmDepositAddress}
          loading={deposit.addressLoading}
          status={deposit.status}
        />
      );
    }

    if (step === "asset") {
      return (
        <DepositAssetStep
          totalBalanceUsd={deposit.totalBalanceUsd}
          chainOptions={deposit.chainOptions}
          tokensForChain={tokensForChain}
          selectedChain={selectedChain}
          selectedToken={selectedToken}
          amount={amount}
          balancesLoading={deposit.balancesLoading}
          assetsLoading={deposit.assetsLoading}
          resolveTokenBalance={deposit.resolveTokenBalance}
          onChainChange={(chain) => {
            setSelectedChain(chain);
            setErrorText(undefined);
          }}
          onTokenChange={(token) => {
            setSelectedToken(token);
            setErrorText(undefined);
          }}
          onAmountChange={(next) => {
            setAmount(next);
            setErrorText(undefined);
          }}
          errorText={errorText}
        />
      );
    }

    if (step === "confirm" && selectedToken) {
      return (
        <DepositConnectedStep
          token={selectedToken}
          amount={amount}
          toAddress={deposit.evmDepositAddress}
          errorText={errorText}
        />
      );
    }

    return <DepositStatusStep txHash={txHash} status={deposit.status} />;
  };

  const renderFooter = () => {
    if (!deposit.walletReady || deposit.isSocialLogin) {
      return undefined;
    }

    if (step === "asset") {
      return (
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          disabled={!selectedToken || amount === ""}
          onClick={handleContinue}
        >
          Continue
        </button>
      );
    }

    if (step === "confirm") {
      return (
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          disabled={submitting}
          onClick={() => void handleConfirmTransfer()}
        >
          {submitting ? "Confirm in wallet…" : "Confirm deposit"}
        </button>
      );
    }

    return (
      <button
        type="button"
        className={fundingPrimaryButtonClass}
        onClick={onClose}
      >
        Done
      </button>
    );
  };

  const onBack =
    !deposit.isSocialLogin && step === "confirm"
      ? () => {
          setErrorText(undefined);
          setStep("asset");
        }
      : undefined;

  return (
    <FundingResponsiveOverlay
      open={open}
      onClose={onClose}
      ariaLabel="Copy trade deposit"
      overlayCloseable={false}
    >
      <FundingModalShell
        title="Deposit"
        onClose={onClose}
        onBack={onBack}
        footer={renderFooter()}
        className="w-full md:w-[500px] min-h-[500px]"
      >
        {renderBody()}
      </FundingModalShell>
    </FundingResponsiveOverlay>
  );
}
