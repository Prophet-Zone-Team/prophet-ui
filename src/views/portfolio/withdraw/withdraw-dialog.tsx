"use client";

import type { QuoteResponse } from "@stableflow/core";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Big from "big.js";

import type { FundingAsset } from "@/config/funding";
import { POLYMARKET_USD } from "@/config/funding";
import { getEvmFundingNetworks } from "@/config/funding/networks";
import { useBridgeQuote, useSupportedAssets, useWithdraw } from "@/hooks/funding";
import {
  buildWithdrawQuoteRequest,
  formatQuoteTokenAmount,
  mapQuoteToBreakdown,
} from "@/lib/funding/bridge-quote";
import { mapStableflowQuoteToConfirmDisplay } from "@/lib/funding/stableflow";
import type { StableflowWithdrawToken } from "@/lib/funding/stableflow-withdraw";
import {
  getDefaultTokenForChain,
  getTokensForChain,
  getUniqueChainsFromAssets,
  type SupportedChainOption,
} from "@/lib/funding/supported-assets";
import { cn } from "@/lib/cn";
import { reportFundingTransaction } from "@/lib/portfolio/user";
import { fetchJson } from "@/lib/team/client-fetch";
import { formatShortWallet } from "@/lib/team/detail-format";
import { ensureTradingChain } from "@/lib/trading/wallet-trading-chain";
import { TransactionBreakdown } from "@/views/portfolio/deposit/transaction-breakdown";
import {
  depositTokenRowClass,
  depositTokenRowSelectedClass,
} from "@/views/portfolio/deposit/deposit-ui";
import { getEffectiveMinDepositUsd } from "@/views/portfolio/deposit/utils";
import {
  WITHDRAW_MODAL_WIDTH,
  WITHDRAW_SOURCE_TOKEN_LABEL,
} from "@/views/portfolio/withdraw/config";
import { WithdrawEntryStep } from "@/views/portfolio/withdraw/withdraw-entry-step";
import { WithdrawStatusStep } from "@/views/portfolio/withdraw/withdraw-status-step";
import {
  isStableflowWithdrawSelectableToken,
  type WithdrawMethod,
  type WithdrawSelectableToken,
  type WithdrawStep,
} from "@/views/portfolio/withdraw/types";
import { parseWithdrawAmount, validateWithdrawAmount } from "@/views/portfolio/withdraw/utils";
import {
  withdrawAmountInputClass,
  withdrawFieldLabelClass,
  withdrawInputBoxClass,
  withdrawMaxButtonClass,
} from "@/views/portfolio/withdraw/withdraw-ui";
import {
  FundingModalShell,
  fundingPrimaryButtonClass,
} from "@/views/portfolio/shared/funding-modal-shell";
import { FundingResponsiveOverlay } from "@/views/portfolio/shared/funding-responsive-overlay";
import { FundingSelectorDropdown } from "@/views/portfolio/shared/funding-selector-dropdown";
import { TokenIcon, WalletAvatarIcon } from "@/views/portfolio/shared/token-icon";
import { formatNumber, removeNumberEndZero } from "@/utils";
import { usePortfolioContext } from "../context";

const EVM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const INITIAL_STEP: WithdrawStep = "entry";

export interface WithdrawDialogProps {
  open: boolean;
  onClose: () => void;
}

export function WithdrawDialog({ open, onClose }: WithdrawDialogProps) {
  const { session, portfolio, reload } = usePortfolioContext();
  const { supportedAssets, loading: assetsLoading } = useSupportedAssets({ enabled: open });
  const {
    status,
    error: withdrawError,
    operationPhase,
    operationDetail,
    executeBridgeWithdraw,
    executeStableflowWithdraw,
    fetchStableflowWithdrawQuote,
    stopStatusPoll,
  } = useWithdraw();

  const [step, setStep] = useState<WithdrawStep>(INITIAL_STEP);
  const [withdrawMethod, setWithdrawMethod] = useState<WithdrawMethod>("bridge");
  const [amountInput, setAmountInput] = useState("");
  const [selectedChain, setSelectedChain] = useState<SupportedChainOption | undefined>();
  const [selectedToken, setSelectedToken] = useState<WithdrawSelectableToken | undefined>();
  const [recipientInput, setRecipientInput] = useState("");
  const [stableflowTokens, setStableflowTokens] = useState<StableflowWithdrawToken[]>([]);
  const [stableflowTokensLoading, setStableflowTokensLoading] = useState(false);
  const [stableflowQuote, setStableflowQuote] = useState<QuoteResponse | undefined>();
  const [stableflowQuoteLoading, setStableflowQuoteLoading] = useState(false);
  const [stableflowQuoteError, setStableflowQuoteError] = useState<string | undefined>();
  const [chainDropdownOpen, setChainDropdownOpen] = useState(false);
  const [tokenDropdownOpen, setTokenDropdownOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isBridge = withdrawMethod === "bridge";

  const bridgeChainOptions = useMemo(
    () => getUniqueChainsFromAssets(supportedAssets),
    [supportedAssets],
  );

  const stableflowChainOptions = useMemo(
    () =>
      getEvmFundingNetworks().map((network) => ({
        chainId: network.chainId,
        chainName: network.chainName,
        chainIcon: network.chainIcon,
      })),
    [],
  );

  const chainOptions = isBridge ? bridgeChainOptions : stableflowChainOptions;

  const tokensForChain = useMemo(() => {
    if (!selectedChain) {
      return [];
    }

    if (isBridge) {
      return getTokensForChain(supportedAssets, selectedChain.chainId);
    }

    return stableflowTokens.filter((token) => token.chainId === selectedChain.chainId);
  }, [isBridge, selectedChain, stableflowTokens, supportedAssets]);

  const assetsLoadingForMethod = isBridge ? assetsLoading : stableflowTokensLoading;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (session?.walletAddress && !recipientInput) {
      setRecipientInput(session.walletAddress);
    }
  }, [open, recipientInput, session?.walletAddress]);

  useEffect(() => {
    if (!open || chainOptions.length === 0) {
      return;
    }

    setSelectedChain((current) => {
      if (current && chainOptions.some((chain) => chain.chainId === current.chainId)) {
        return current;
      }

      const defaultChain = chainOptions.find((chain) => chain.chainId === 137);
      return defaultChain ?? chainOptions[0];
    });
  }, [open, chainOptions]);

  useEffect(() => {
    if (!selectedChain) {
      setSelectedToken(undefined);
      return;
    }

    if (isBridge) {
      if (supportedAssets.length === 0) {
        setSelectedToken(undefined);
        return;
      }

      setSelectedToken((current) => {
        if (current && !("assetId" in current) && current.chainId === selectedChain.chainId) {
          return current;
        }

        return getDefaultTokenForChain(supportedAssets, selectedChain.chainId);
      });

      return;
    }

    setSelectedToken((current) => {
      if (current && "assetId" in current && current.chainId === selectedChain.chainId) {
        return current;
      }

      return (
        stableflowTokens.find((token) => token.chainId === selectedChain.chainId) ??
        stableflowTokens.find((token) => token.symbol === "USDC")
      );
    });
  }, [isBridge, selectedChain, stableflowTokens, supportedAssets]);

  const amount = parseWithdrawAmount(amountInput);
  const maxAmount = portfolio?.availableToTrade ?? 0;
  const effectiveMinUsd =
    isBridge && selectedToken && !("assetId" in selectedToken)
      ? getEffectiveMinDepositUsd(selectedToken.minCheckoutUsd)
      : 0;
  const validationError = validateWithdrawAmount(amount, maxAmount, {
    minWithdrawUsd: effectiveMinUsd,
  });
  const recipientError =
    !isBridge && recipientInput.trim() && !EVM_ADDRESS_PATTERN.test(recipientInput.trim())
      ? "Enter a valid EVM recipient address."
      : undefined;
  const formError = validationError ?? recipientError;

  const quoteEnabled =
    open &&
    step === "form" &&
    !!session?.walletAddress &&
    !!selectedToken &&
    amount !== undefined &&
    amount > 0 &&
    formError === undefined &&
    (isBridge || EVM_ADDRESS_PATTERN.test(recipientInput.trim()));

  const bridgeQuoteRequest = useMemo(
    () =>
      isBridge && selectedToken && !("assetId" in selectedToken) && session?.walletAddress
        ? buildWithdrawQuoteRequest({
            token: selectedToken,
            amount: amountInput,
            recipientAddress: session.walletAddress,
          })
        : undefined,
    [amountInput, isBridge, selectedToken, session],
  );

  const { quote: bridgeQuote, loading: bridgeQuoteLoading, error: bridgeQuoteError } = useBridgeQuote({
    request: bridgeQuoteRequest,
    enabled: quoteEnabled && isBridge,
  });

  useEffect(() => {
    if (!quoteEnabled || isBridge || !isStableflowWithdrawSelectableToken(selectedToken)) {
      setStableflowQuote(undefined);
      setStableflowQuoteError(undefined);
      return;
    }

    let cancelled = false;
    setStableflowQuoteLoading(true);
    setStableflowQuoteError(undefined);

    void fetchStableflowWithdrawQuote({
      amountUsd: amount!,
      destinationToken: selectedToken,
      recipient: recipientInput.trim(),
      dry: true,
    })
      .then((quote) => {
        if (!cancelled) {
          setStableflowQuote(quote);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStableflowQuote(undefined);
          setStableflowQuoteError(error instanceof Error ? error.message : String(error));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setStableflowQuoteLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    amount,
    amountInput,
    fetchStableflowWithdrawQuote,
    isBridge,
    quoteEnabled,
    recipientInput,
    selectedToken,
  ]);

  const stableflowDisplay = useMemo(
    () => (stableflowQuote ? mapStableflowQuoteToConfirmDisplay(stableflowQuote) : undefined),
    [stableflowQuote],
  );

  const breakdown = bridgeQuote ? mapQuoteToBreakdown(bridgeQuote) : undefined;

  const receiveTokenAmount = isBridge
    ? bridgeQuote
      ? formatQuoteTokenAmount(bridgeQuote.estToTokenBaseUnit, selectedToken?.decimals ?? 6)
      : undefined
    : stableflowDisplay?.receiveAmountFormatted;

  const quoteLoading = isBridge ? bridgeQuoteLoading : stableflowQuoteLoading;
  const quoteError = isBridge ? bridgeQuoteError : stableflowQuoteError;

  const receiveLabel =
    quoteLoading && quoteEnabled
      ? "…"
      : receiveTokenAmount && selectedToken
        ? isBridge
          ? `${formatNumber(receiveTokenAmount, 4, true, { round: 0 })} ${selectedToken.symbol}`
          : receiveTokenAmount
        : "--";

  const fiatLabel =
    quoteLoading && quoteEnabled
      ? "…"
      : isBridge && bridgeQuote
        ? `~${formatNumber(bridgeQuote.estOutputUsd, 2, true, { round: 0 })}`
        : stableflowDisplay
          ? `~${formatNumber(stableflowDisplay.estOutputUsd, 2, true, { round: 0 })}`
          : "--";

  const isBusy =
    submitting ||
    status === "preparing" ||
    status === "awaiting_wallet" ||
    status === "polling" ||
    status === "syncing" ||
    (step === "status" && operationPhase !== "idle" && operationPhase !== "error" && operationPhase !== "success");

  const canSubmit =
    !assetsLoadingForMethod &&
    !!session?.walletAddress &&
    !!selectedToken &&
    formError === undefined &&
    amount !== undefined &&
    !isBusy;

  const resetForm = useCallback(() => {
    setStep(INITIAL_STEP);
    setWithdrawMethod("bridge");
    setAmountInput("");
    setSelectedChain(undefined);
    setSelectedToken(undefined);
    setRecipientInput("");
    setStableflowQuote(undefined);
    setStableflowQuoteError(undefined);
    setChainDropdownOpen(false);
    setTokenDropdownOpen(false);
    setSubmitting(false);
    stopStatusPoll();
  }, [stopStatusPoll]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  const loadStableflowTokens = useCallback(async () => {
    setStableflowTokensLoading(true);

    try {
      const payload = await fetchJson<{ tokens: StableflowWithdrawToken[] }>(
        "/api/trading/stableflow/tokens",
      );
      setStableflowTokens(payload.tokens);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
      throw error;
    } finally {
      setStableflowTokensLoading(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    if (step === "form") {
      setStep("entry");
      setAmountInput("");
      setSelectedChain(undefined);
      setSelectedToken(undefined);
      setStableflowQuote(undefined);
      return;
    }

    if (step === "status") {
      setStep("form");
      stopStatusPoll();
    }
  }, [step, stopStatusPoll]);

  const handleChainSelect = useCallback((chain: SupportedChainOption) => {
    setSelectedChain(chain);
    setChainDropdownOpen(false);
    setTokenDropdownOpen(false);
  }, []);

  const handleTokenSelect = useCallback((token: WithdrawSelectableToken) => {
    setSelectedToken(token);
    setTokenDropdownOpen(false);
  }, []);

  const handleMax = useCallback(() => {
    setAmountInput(
      removeNumberEndZero(
        Big(portfolio?.availableToTrade || 0).toFixed(POLYMARKET_USD.decimals, Big.roundDown),
      ),
    );
  }, [portfolio?.availableToTrade]);

  const handleWithdraw = useCallback(async () => {
    if (!canSubmit || !session?.walletAddress || !selectedToken || amount === undefined) {
      return;
    }

    setSubmitting(true);
    setStep("status");

    try {
      await ensureTradingChain(session.walletAddress);
      let txHash: string | undefined;

      if (isBridge && !("assetId" in selectedToken)) {
        const result = await executeBridgeWithdraw({
          toChainId: String(selectedToken.chainId),
          toTokenAddress: selectedToken.address,
          recipientAddr: session.walletAddress,
          amountUsd: amount,
        });
        txHash = result.txHash;
      } else if (isStableflowWithdrawSelectableToken(selectedToken)) {
        const result = await executeStableflowWithdraw({
          amountUsd: amount,
          destinationToken: selectedToken,
          recipient: recipientInput.trim(),
        });
        txHash = result.txHash;
      } else {
        throw new Error("Selected token is not supported for this withdrawal method.");
      }

      if (txHash) {
        void reportFundingTransaction({
          type: "withdraw",
          txHash,
          amount: String(amount)
        });
      }

      toast.success("Withdrawal submitted");
      handleClose();
      reload();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [
    amount,
    canSubmit,
    executeBridgeWithdraw,
    executeStableflowWithdraw,
    handleClose,
    isBridge,
    recipientInput,
    reload,
    selectedToken,
    session,
  ]);

  const onSelectStableflow = async () => {
    try {
      if (stableflowTokens.length === 0) {
        await loadStableflowTokens();
      }

      setWithdrawMethod("stableflow");
      setSelectedChain(undefined);
      setSelectedToken(undefined);
      setStep("form");
    } catch {
      // toast already shown
    }
  };

  const modalWidth = step === "entry" ? WITHDRAW_MODAL_WIDTH.entry : WITHDRAW_MODAL_WIDTH.form;
  const showBack = step === "form" || step === "status";
  const showFooter = step === "form";

  const ariaLabel =
    step === "entry" ? "Withdraw entry" : step === "status" ? "Withdraw status" : "Withdraw funds";

  return (
    <FundingResponsiveOverlay
      open={open}
      onClose={handleClose}
      ariaLabel={ariaLabel}
      className={modalWidth}
      hideCloseButton
      overlayCloseable={false}
    >
      <FundingModalShell
        title="Withdraw"
        onClose={handleClose}
        onBack={showBack ? handleBack : undefined}
        className={
          step === "entry"
            ? "min-h-0 md:min-h-[400px]"
            : "min-h-0 md:min-h-[680px]"
        }
        footer={
          showFooter ? (
            <button
              type="button"
              className={fundingPrimaryButtonClass}
              disabled={!canSubmit}
              onClick={() => void handleWithdraw()}
            >
              {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Withdraw
            </button>
          ) : undefined
        }
      >
        {step === "entry" ? (
          <WithdrawEntryStep
            onSelectBridge={() => {
              setWithdrawMethod("bridge");
              setStep("form");
            }}
            onSelectStableflow={() => void onSelectStableflow()}
            stableflowLoading={stableflowTokensLoading}
          />
        ) : null}

        {step === "form" ? (
          <div className="flex flex-col gap-5 pb-10 md:pb-2">
            <div className="flex flex-col gap-2">
              <span className={withdrawFieldLabelClass}>Recipient Address</span>
              {isBridge ? (
                <div className={withdrawInputBoxClass}>
                  <span className="flex min-w-0 items-center gap-2">
                    <WalletAvatarIcon address={session?.walletAddress} />
                    <span className="truncate text-base font-[500] text-black">
                      {formatShortWallet(session?.walletAddress)}
                    </span>
                  </span>
                  <span className="shrink-0 text-base font-[500] text-[#909090]">
                    Connected
                  </span>
                </div>
              ) : (
                <div className={withdrawInputBoxClass}>
                  <input
                    type="text"
                    value={recipientInput}
                    onChange={(event) => setRecipientInput(event.target.value)}
                    className={withdrawAmountInputClass}
                    placeholder="0x…"
                    aria-label="Recipient address"
                    spellCheck={false}
                  />
                </div>
              )}
              {recipientError ? (
                <p className="m-0 text-sm text-prophet-red">{recipientError}</p>
              ) : null}
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
                  <span className="text-base font-[500] text-[#909090]">
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
              {formError && amountInput.trim() ? (
                <p className="m-0 text-sm text-prophet-red">{formError}</p>
              ) : null}
              {withdrawError && step === "form" ? (
                <p className="m-0 text-sm text-prophet-red">{withdrawError}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FundingSelectorDropdown
                label="Receive Chain"
                triggerLabel={
                  selectedChain?.chainName ??
                  (assetsLoadingForMethod ? "Loading…" : "Select chain")
                }
                disabled={assetsLoadingForMethod || chainOptions.length === 0}
                open={chainDropdownOpen}
                onOpenChange={(next) => {
                  setChainDropdownOpen(next);
                  if (next) {
                    setTokenDropdownOpen(false);
                  }
                }}
                triggerIcon={
                  selectedChain ? (
                    <TokenIcon
                      symbol="USDC"
                      chainLabel={selectedChain.chainName}
                      chainIcon={selectedChain.chainIcon}
                      size="sm"
                      chainOnly
                    />
                  ) : null
                }
              >
                {chainOptions.map((chain) => (
                  <button
                    key={chain.chainId}
                    type="button"
                    role="option"
                    aria-selected={selectedChain?.chainId === chain.chainId}
                    className={cn(
                      depositTokenRowClass,
                      "w-full",
                      selectedChain?.chainId === chain.chainId &&
                        depositTokenRowSelectedClass
                    )}
                    onClick={() => handleChainSelect(chain)}
                  >
                    <TokenIcon
                      symbol="USDC"
                      chainLabel={chain.chainName}
                      chainIcon={chain.chainIcon}
                      size="sm"
                      chainOnly
                    />
                    <span className="text-sm font-[500] text-black">
                      {chain.chainName}
                    </span>
                  </button>
                ))}
              </FundingSelectorDropdown>

              <FundingSelectorDropdown
                label="Receive Token"
                triggerLabel={
                  selectedToken?.symbol ??
                  (assetsLoadingForMethod ? "Loading…" : "Select token")
                }
                disabled={assetsLoadingForMethod || tokensForChain.length === 0}
                open={tokenDropdownOpen}
                onOpenChange={(next) => {
                  setTokenDropdownOpen(next);
                  if (next) {
                    setChainDropdownOpen(false);
                  }
                }}
                triggerIcon={
                  selectedToken ? (
                    <TokenIcon
                      symbol={selectedToken.symbol}
                      icon={selectedToken.icon}
                      size="sm"
                    />
                  ) : null
                }
              >
                {tokensForChain.map((token) => (
                  <button
                    key={`${token.chainId}-${token.address}`}
                    type="button"
                    role="option"
                    aria-selected={
                      selectedToken?.chainId === token.chainId &&
                      selectedToken?.address === token.address
                    }
                    className={cn(
                      depositTokenRowClass,
                      "w-full",
                      selectedToken?.chainId === token.chainId &&
                        selectedToken?.address === token.address &&
                        depositTokenRowSelectedClass
                    )}
                    onClick={() => handleTokenSelect(token)}
                  >
                    <TokenIcon
                      symbol={token.symbol}
                      chainLabel={token.chainName}
                      icon={token.icon}
                      chainIcon={token.chainIcon}
                      size="sm"
                    />
                    <span className="text-sm font-[500] text-black">
                      {token.symbol}
                    </span>
                  </button>
                ))}
              </FundingSelectorDropdown>
            </div>

            <div className="flex flex-col gap-1 py-1">
              <div className="flex items-center justify-between">
                <span className={withdrawFieldLabelClass}>Est. Receive</span>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-base font-[500] text-black">
                    {receiveLabel}
                  </span>
                  <span className="text-base font-[500] text-[#909090]">
                    {fiatLabel}
                  </span>
                </div>
              </div>
              {quoteError ? (
                <p className="m-0 text-right text-sm text-[#909090]">
                  Quote unavailable; estimated output not shown.
                </p>
              ) : null}
            </div>

            <TransactionBreakdown
              loading={quoteLoading && quoteEnabled && isBridge}
              networkCostUsd={breakdown?.networkCost}
              priceImpactPercent={breakdown?.priceImpactPercent}
              maxSlippagePercent={breakdown?.maxSlippagePercent}
            />
          </div>
        ) : null}

        {step === "status" ? (
          <WithdrawStatusStep
            phase={operationPhase}
            detail={operationDetail}
            error={withdrawError}
          />
        ) : null}
      </FundingModalShell>
    </FundingResponsiveOverlay>
  );
}
