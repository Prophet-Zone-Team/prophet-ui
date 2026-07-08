"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import type { FundingAsset } from "@/config/funding";
import { useCopyTradeDeposit } from "@/hooks/copy-trade/use-copy-trade-deposit";
import { useFundingWalletConnect } from "@/hooks/funding/use-funding-wallet-connect";
import {
  resolveCopyDepositAddress,
  type CopyDepositChainOption,
} from "@/lib/copy-trade/deposit-assets";
import { requiresDepositFundingWalletConnection } from "@/lib/funding/stableflow";
import { isTpFundingSwitchPendingError } from "@/lib/wallet/tokenpocket/tp-funding-switch";
import { DEFAULT_DEPOSIT_ASSET, POLYGON_NETWORK } from "@/lib/market/deposit-assets";
import { useAuthStore } from "@/store/auth-store";
import { formatNumber } from "@/utils";
import { DepositAssetStep } from "@/views/copy-trade/funding/deposit-asset-step";
import { DepositConnectedStep } from "@/views/copy-trade/funding/deposit-connected-step";
import { DepositQrStep } from "@/views/copy-trade/funding/deposit-address-step";
import { DepositStatusStep } from "@/views/copy-trade/funding/deposit-status-step";
import type { CopyDepositStep } from "@/views/copy-trade/funding/types";
import {
  FundingModalShell,
  fundingPrimaryButtonClass,
} from "@/views/portfolio/shared/funding-modal-shell";
import { FundingResponsiveOverlay } from "@/views/portfolio/shared/funding-responsive-overlay";
import Big from "big.js";
import { Loader2 } from "lucide-react";

export interface CopyTradeDepositDialogProps {
  open: boolean;
  onClose: () => void;
}

function pickDefaultToken(tokens: FundingAsset[]): FundingAsset | undefined {
  return (
    tokens.find((token) => {
      if (token.chainId === 56) {
        return (
          token.symbol === DEFAULT_DEPOSIT_ASSET.symbol &&
          token.name === "USD Coin"
        );
      }
      return token.symbol === DEFAULT_DEPOSIT_ASSET.symbol;
    }) ?? tokens[0]
  );
}

export function CopyTradeDepositDialog({
  open,
  onClose,
}: CopyTradeDepositDialogProps) {
  const t = useTranslations("copyTrade.funding.deposit");
  const tPortfolio = useTranslations("portfolio");
  const tAuth = useTranslations("auth");
  const tWallet = useTranslations("wallet");
  const loginMethod = useAuthStore((state) => state.loginMethod);
  const sessionWalletAddress = useAuthStore(
    (state) => state.session?.walletAddress,
  );

  const [step, setStep] = useState<CopyDepositStep>("asset");
  const [selectedChain, setSelectedChain] =
    useState<CopyDepositChainOption | null>(null);
  const [selectedToken, setSelectedToken] = useState<FundingAsset | null>(null);
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [errorText, setErrorText] = useState<string | undefined>();

  const handleCredited = useCallback(
    (credited: number) => {
      toast.success(
        t("depositCredited", { amount: formatNumber(credited, 2) }),
      );
    },
    [t],
  );

  const deposit = useCopyTradeDeposit({
    open,
    onCredited: handleCredited,
    aggressiveStatusPolling: step === "status",
  });

  const {
    connectForDepositToken,
    isConnectedForDepositToken,
    getDepositConnectLabelKey,
  } = useFundingWalletConnect();

  const tokensForChain = useMemo(
    () =>
      selectedChain ? deposit.getTokensForChain(selectedChain.chainId) : [],
    [deposit, selectedChain],
  );

  const qrDepositAddress = useMemo(() => {
    if (!selectedChain) {
      return "";
    }
    return resolveCopyDepositAddress(
      deposit.depositAddress,
      selectedChain.chainType,
    );
  }, [deposit.depositAddress, selectedChain]);

  const formatDepositConnectLabel = useCallback(
    (token: FundingAsset) => {
      const labelKey = getDepositConnectLabelKey(token);
      if (labelKey === "connectChainWallet") {
        return tWallet(labelKey, { chainName: token.chainName });
      }
      return tWallet(labelKey);
    },
    [getDepositConnectLabelKey, tWallet],
  );

  const handleFundingWalletConnect = useCallback(
    async (token: FundingAsset) => {
      setConnectingWallet(true);
      try {
        await connectForDepositToken(token, loginMethod);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (isTpFundingSwitchPendingError(error)) {
          toast.message(message);
          return;
        }
        toast.error(message);
      } finally {
        setConnectingWallet(false);
      }
    },
    [connectForDepositToken, loginMethod],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setStep(deposit.isSocialLogin ? "qr" : "asset");
    setAmount("");
    setTxHash("");
    setErrorText(undefined);
  }, [deposit.isSocialLogin, open]);

  useEffect(() => {
    if (!selectedChain && deposit.chainOptions.length > 0) {
      const defaultSelectedChain =
        deposit.chainOptions.find(
          (chain) => chain.chainId === POLYGON_NETWORK.chainId,
        ) ?? deposit.chainOptions[0];
      setSelectedChain(defaultSelectedChain);
    }
  }, [deposit.chainOptions, selectedChain]);

  useEffect(() => {
    if (!selectedChain) {
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
      const defaultSelectedToken = pickDefaultToken(tokensForChain);
      setSelectedToken(defaultSelectedToken ?? null);
    }
  }, [selectedChain, selectedToken, tokensForChain]);

  const validateAmount = (): string | undefined => {
    if (!selectedToken) {
      return t("selectTokenToDeposit");
    }
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return t("validAmount");
    }
    const balance = Number(deposit.resolveTokenBalance(selectedToken));
    if (value > balance) {
      return t("amountExceedsWalletBalance");
    }
    if (value < selectedToken.minCheckoutUsd) {
      return t("minimumDeposit", {
        amount: formatNumber(selectedToken.minCheckoutUsd, 2, true, {
          prefix: "$",
        }),
      });
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

  const handleContinueFromQr = () => {
    setStep("status");
    void deposit.refreshStatus();
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
      toast.success(t("transferSubmitted"));
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  };

  const renderBody = () => {
    if (!deposit.walletReady) {
      return (
        <p className="py-8 text-center text-sm text-prophet-muted">
          {t("walletNotReady")}
        </p>
      );
    }

    if (deposit.isSocialLogin) {
      if (step === "qr") {
        return (
          <DepositQrStep
            chainOptions={deposit.chainOptions}
            tokensForChain={tokensForChain}
            selectedChain={selectedChain}
            selectedToken={selectedToken}
            depositAddress={qrDepositAddress}
            loading={deposit.addressLoading}
            assetsLoading={deposit.assetsLoading}
            onChainChange={(chain) => {
              setSelectedChain(chain);
            }}
            onTokenChange={setSelectedToken}
          />
        );
      }

      return (
        <DepositStatusStep
          txHash=""
          status={deposit.status}
          mode="qr"
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
          toAddress={deposit.resolveDepositAddressForToken(selectedToken)}
          errorText={errorText}
        />
      );
    }

    return (
      <DepositStatusStep
        txHash={txHash}
        status={deposit.status}
        mode="wallet"
      />
    );
  };

  const renderFooter = () => {
    if (!deposit.walletReady) {
      return undefined;
    }

    if (deposit.isSocialLogin) {
      if (step === "qr") {
        const canContinue =
          Boolean(qrDepositAddress) && !deposit.addressLoading;

        return (
          <button
            type="button"
            className={fundingPrimaryButtonClass}
            disabled={!canContinue}
            onClick={handleContinueFromQr}
          >
            {t("iHaveTransferred")}
          </button>
        );
      }

      if (step === "status") {
        return (
          <button
            type="button"
            className={fundingPrimaryButtonClass}
            onClick={onClose}
          >
            {tAuth("done")}
          </button>
        );
      }

      return undefined;
    }

    if (step === "asset") {
      if (selectedToken) {
        const needsFundingWallet = requiresDepositFundingWalletConnection(
          selectedToken,
          loginMethod,
        );
        const walletConnected = isConnectedForDepositToken(
          selectedToken,
          loginMethod,
          sessionWalletAddress,
        );

        if (needsFundingWallet && !walletConnected) {
          return (
            <button
              type="button"
              className={fundingPrimaryButtonClass}
              disabled={connectingWallet}
              onClick={() => void handleFundingWalletConnect(selectedToken)}
            >
              {connectingWallet ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {formatDepositConnectLabel(selectedToken)}
            </button>
          );
        }
      }

      return (
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          disabled={
            !selectedToken ||
            !amount ||
            Big(amount).lte(0) ||
            deposit.balancesLoading
          }
          onClick={handleContinue}
        >
          {deposit.balancesLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          {tAuth("continue")}
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
          {submitting ? t("confirmInWallet") : t("confirmDeposit")}
        </button>
      );
    }

    if (step === "status") {
      return (
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          onClick={onClose}
        >
          {tAuth("done")}
        </button>
      );
    }

    return undefined;
  };

  const onBack = deposit.isSocialLogin
    ? step === "status"
      ? () => setStep("qr")
      : undefined
    : step === "confirm"
      ? () => {
          setErrorText(undefined);
          setStep("asset");
        }
      : undefined;

  return (
    <FundingResponsiveOverlay
      open={open}
      onClose={onClose}
      ariaLabel={t("ariaDeposit")}
      overlayCloseable={false}
    >
      <FundingModalShell
        title={tPortfolio("depositLabel")}
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
