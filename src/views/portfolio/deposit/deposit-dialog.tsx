"use client";

import type { OneClickStatus, QuoteResponse } from "@stableflow/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Big from "big.js";
import { Loader2, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useDevice } from "@/hooks/common/use-device";
import { FundingNetworkType } from "@/config/funding";
import { ensureFundingEvmChain } from "@/lib/funding/ensure-funding-evm-chain";
import { reportFundingTransaction } from "@/lib/portfolio/user";
import { selectFundingTokenBalanceString } from "@/lib/funding/balance-selectors";
import type { SupportedChainOption } from "@/lib/funding/supported-assets";
import {
  getStableflowTokensForChain,
  resolveDefaultStableflowQrSelection,
  stableflowTokensToFundingTokens,
  type StableflowDepositToken,
} from "@/lib/funding/stableflow";
import {
  pollStableflowUntilDepositDetected,
} from "@/lib/trading/stableflow-bridge-status";
import {
  executePendingDepositConvert,
  getPendingConvertAmountUsd,
  resolvePendingDepositConvertMode,
  type FunderCollateralBalances
} from "@/lib/trading/deposit-wallet-convert";
import { useDeposit, useEvmBalances, usePrices } from "@/hooks/funding";
import { useAuth } from "@/context/auth";
import { fetchJson } from "@/lib/team/client-fetch";
import { useAuthStore } from "@/store";
import { useBalancesStore } from "@/store/use-balances";
import { usePricesStore } from "@/store";
import { DEPOSIT_ENTRY_MODAL_MIN_HEIGHT, DEPOSIT_MODAL_WIDTH } from "@/views/portfolio/deposit/config";
import { DepositAmountStep } from "@/views/portfolio/deposit/deposit-amount-step";
import { DepositConfirmStep } from "@/views/portfolio/deposit/deposit-confirm-step";
import { DepositEntryStep } from "@/views/portfolio/deposit/deposit-entry-step";
import { depositPrivateFooterLinkClass } from "@/views/portfolio/deposit/deposit-ui";
import { resolvePrivateAccountStatus } from "@/views/portfolio/deposit/resolve-private-account-status";
import {
  DepositStatusStep,
  formatStableflowStatusLabel
} from "@/views/portfolio/deposit/deposit-status-step";
import { DepositStableflowQrStep } from "@/views/portfolio/deposit/deposit-stableflow-qr-step";
import { DepositTokenStep } from "@/views/portfolio/deposit/deposit-token-step";
import type {
  DepositAmountState,
  DepositEntryTab,
  DepositMethod,
  DepositSelectableToken,
  DepositStatusPhase,
  DepositStep,
  StableflowDepositContext
} from "@/views/portfolio/deposit/types";
import { isStableflowDepositToken } from "@/views/portfolio/deposit/types";
import {
  buildDepositAmountFromMaxBalance,
  buildDepositAmountFromMinUsd,
  buildStableflowQrQuoteAmount,
  getEffectiveMinDepositUsd,
} from "@/views/portfolio/deposit/utils";
import {
  FundingModalShell,
  fundingPrimaryButtonClass
} from "@/views/portfolio/shared/funding-modal-shell";
import { FundingResponsiveOverlay } from "@/views/portfolio/shared/funding-responsive-overlay";
import { DepositProvider } from "./context";

export interface DepositDialogProps {
  open: boolean;
  onClose: () => void;
  onDepositSuccess?: () => void | Promise<void>;
  onOpenPrivateTopup?: () => void;
  onPendingDepositChange?: (hasPending: boolean) => void;
}

const INITIAL_STEP: DepositStep = "entry";

const INITIAL_AMOUNT: DepositAmountState = { tokenAmount: "0", amountUsd: "0" };

const INITIAL_ENTRY_TAB: DepositEntryTab = "crypto";

export function DepositDialog({
  open,
  onClose,
  onDepositSuccess,
  onOpenPrivateTopup,
  onPendingDepositChange,
}: DepositDialogProps) {
  const tPortfolio = useTranslations("portfolio");
  const tDeposit = useTranslations("portfolio.deposit");
  const tWallet = useTranslations("wallet");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const {
    session,
    syncCash,
    refreshPrivateBalance,
    privateBalance,
    onAuthenticateConfidential,
    confidentialAccount,
    confirmPendingDeposit,
  } = useAuth();
  const loginMethod = useAuthStore((state) => state.loginMethod);
  const isSocialLogin = loginMethod === "email" || loginMethod === "google";
  const isMobile = useDevice();

  const {
    hasPendingDeposit,
    converting: pendingConverting,
    confirmPendingDeposit: onConfirmPendingDeposit,
  } = confirmPendingDeposit;

  useEffect(() => {
    onPendingDepositChange?.(hasPendingDeposit);
  }, [hasPendingDeposit, onPendingDepositChange]);

  const onConfirmPendingDepositFromEntry = useCallback(async () => {
    try {
      await onConfirmPendingDeposit();
      toast.success(tDeposit("depositSuccessful"));

      if (onDepositSuccess) {
        await onDepositSuccess();
      } else {
        await syncCash();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    }
  }, [onConfirmPendingDeposit, onDepositSuccess, syncCash, tDeposit]);

  const [step, setStep] = useState<DepositStep>(INITIAL_STEP);
  const [entryTab, setEntryTab] = useState<DepositEntryTab>(INITIAL_ENTRY_TAB);
  const [depositMethod, setDepositMethod] =
    useState<DepositMethod>("connected");
  const [selectedToken, setSelectedToken] = useState<
    DepositSelectableToken | undefined
  >();
  const [amount, setAmount] = useState<DepositAmountState>(INITIAL_AMOUNT);
  const [continueLoading, setContinueLoading] = useState(false);
  const [stableflowTokens, setStableflowTokens] = useState<
    StableflowDepositToken[]
  >([]);
  const [stableflowTokensLoading, setStableflowTokensLoading] = useState(false);
  const [polygonUsdcDestinationAssetId, setPolygonUsdcDestinationAssetId] =
    useState<string | undefined>();
  const [stableflowQuote, setStableflowQuote] = useState<
    QuoteResponse | undefined
  >();
  const [stableflowQuoteLoading, setStableflowQuoteLoading] = useState(false);
  const [qrSelectedChain, setQrSelectedChain] = useState<
    SupportedChainOption | undefined
  >();
  const [stableflowExecution, setStableflowExecution] = useState<
    StableflowDepositContext | undefined
  >();
  const [statusPhase, setStatusPhase] =
    useState<DepositStatusPhase>("bridging");
  const [bridgeStatusLabel, setBridgeStatusLabel] = useState<
    string | undefined
  >();
  const [convertStatusLabel, setConvertStatusLabel] = useState<
    string | undefined
  >();
  const [detectedUsdcAmount, setDetectedUsdcAmount] = useState<
    string | undefined
  >();
  const [detectedUsdceAmount, setDetectedUsdceAmount] = useState<
    string | undefined
  >();
  const [funderCollateralBalances, setFunderCollateralBalances] =
    useState<FunderCollateralBalances | null>(null);
  const [statusError, setStatusError] = useState<string | undefined>();
  const statusPollAbortRef = useRef<AbortController | undefined>(undefined);
  const qrQuoteAbortRef = useRef<AbortController | undefined>(undefined);
  const qrStatusPollAbortRef = useRef<AbortController | undefined>(undefined);
  const qrTransitionStartedRef = useRef(false);
  const qrQuoteAmountBaseUnitsRef = useRef<string>("0");

  const prices = usePricesStore((state) => state.prices);
  const {
    supportedAssets,
    depositViaPolygon,
    depositViaStableflow,
    pollStableflowBridge,
    pollFunderCollateralBalances,
    stopStatusPoll
  } = useDeposit();

  const pendingConvertMode = funderCollateralBalances
    ? resolvePendingDepositConvertMode(funderCollateralBalances)
    : null;

  const stableflowFundingTokens = useMemo(
    () => stableflowTokensToFundingTokens(stableflowTokens),
    [stableflowTokens]
  );

  const { loading: connectedBalancesLoading, getTokenBalance } = useEvmBalances(
    {
      auto: open,
      enabled: open && !!session && depositMethod === "connected"
    }
  );

  useEvmBalances({
    auto: true,
    enabled:
      open &&
      !!session &&
      depositMethod === "stableflow" &&
      stableflowFundingTokens.length > 0,
    tokens: stableflowFundingTokens,
    merge: true
  });

  const { loading: pricesLoading } = usePrices({
    auto: open,
    enabled: open
  });

  const evmBalances = useBalancesStore((state) => state.evmBalances);
  const balancesLoading =
    depositMethod === "stableflow"
      ? stableflowTokensLoading
      : connectedBalancesLoading;

  const selectableTokens =
    depositMethod === "stableflow" ? stableflowTokens : supportedAssets;

  const selectedTokenMaxAmount = useMemo(() => {
    if (!selectedToken) {
      return "0";
    }

    return selectFundingTokenBalanceString(evmBalances, selectedToken);
  }, [evmBalances, selectedToken]);

  const reset = useCallback(() => {
    setStep(INITIAL_STEP);
    setEntryTab(INITIAL_ENTRY_TAB);
    setDepositMethod("connected");
    setSelectedToken(undefined);
    setAmount(INITIAL_AMOUNT);
    setStableflowQuote(undefined);
    setStableflowQuoteLoading(false);
    setQrSelectedChain(undefined);
    setStableflowExecution(undefined);
    qrQuoteAbortRef.current?.abort();
    qrQuoteAbortRef.current = undefined;
    qrStatusPollAbortRef.current?.abort();
    qrStatusPollAbortRef.current = undefined;
    qrTransitionStartedRef.current = false;
    qrQuoteAmountBaseUnitsRef.current = "0";
    setStatusPhase("bridging");
    setBridgeStatusLabel(undefined);
    setConvertStatusLabel(undefined);
    setDetectedUsdcAmount(undefined);
    setDetectedUsdceAmount(undefined);
    setFunderCollateralBalances(null);
    setStatusError(undefined);
    statusPollAbortRef.current?.abort();
    statusPollAbortRef.current = undefined;
    stopStatusPoll();
  }, [stopStatusPoll]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    refreshPrivateBalance();
  }, [open, reset]);

  const loadStableflowTokens = useCallback(async () => {
    setStableflowTokensLoading(true);

    try {
      const payload = await fetchJson<{
        tokens: StableflowDepositToken[];
        polygonUsdcDestinationAssetId: string;
      }>("/api/trading/stableflow/tokens");

      setStableflowTokens(payload.tokens);
      setPolygonUsdcDestinationAssetId(payload.polygonUsdcDestinationAssetId);

      return payload;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
      throw error;
    } finally {
      setStableflowTokensLoading(false);
    }
  }, []);

  const modalWidth =
    step === "entry" ? DEPOSIT_MODAL_WIDTH.entry : DEPOSIT_MODAL_WIDTH.step;

  const ariaLabel = useMemo(() => {
    switch (step) {
      case "entry":
        return tDeposit("ariaEntry");
      case "tokens":
        return tDeposit("ariaSelectToken");
      case "amount":
        return tDeposit("ariaAmount");
      case "confirm":
        return tDeposit("ariaConfirm");
      case "status":
        return tDeposit("ariaStatus");
      case "stableflow_qr":
        return tDeposit("ariaStableflowAddress");
      default:
        return tDeposit("ariaDefault");
    }
  }, [step, tDeposit]);

  function handleBack() {
    if (step === "stableflow_qr") {
      qrQuoteAbortRef.current?.abort();
      qrQuoteAbortRef.current = undefined;
      qrStatusPollAbortRef.current?.abort();
      qrStatusPollAbortRef.current = undefined;
      qrTransitionStartedRef.current = false;
      setStableflowQuote(undefined);
      setStableflowQuoteLoading(false);
      setQrSelectedChain(undefined);
      setStep("entry");
      setSelectedToken(undefined);
      return;
    }

    if (step === "tokens") {
      setStep("entry");
      setSelectedToken(undefined);
      return;
    }

    if (step === "amount") {
      setStep("tokens");
      setAmount(INITIAL_AMOUNT);
      return;
    }

    if (step === "confirm") {
      setStep("amount");
      return;
    }

    if (step === "status") {
      if (isSocialLogin) {
        setStep("stableflow_qr");
      } else {
        setStep("confirm");
      }
      statusPollAbortRef.current?.abort();
      statusPollAbortRef.current = undefined;
    }
  }

  const showBack = !["entry"].includes(step);

  const onSelectStableflow = async () => {
    try {
      let tokens = stableflowTokens;

      if (tokens.length === 0) {
        const payload = await loadStableflowTokens();
        tokens = payload?.tokens ?? [];
      }

      setDepositMethod("stableflow");

      if (isSocialLogin) {
        const selection = resolveDefaultStableflowQrSelection(tokens);

        if (!selection) {
          toast.error(tDeposit("stableflowNotReady"));
          return;
        }

        setQrSelectedChain(selection.chain);
        setSelectedToken(selection.token);
        setStableflowQuote(undefined);
        qrTransitionStartedRef.current = false;
        setStep("stableflow_qr");
      } else {
        setSelectedToken(undefined);
        setStep("tokens");
      }
    } catch {
      // toast already shown
    }
  };

  const handleQrChainChange = useCallback(
    (chain: SupportedChainOption) => {
      setQrSelectedChain(chain);
      qrTransitionStartedRef.current = false;

      const tokensOnChain = getStableflowTokensForChain(
        stableflowTokens,
        chain.chainId,
      );
      const nextToken =
        tokensOnChain.find((token) => token.symbol === "USDC") ??
        tokensOnChain[0];

      if (nextToken) {
        setSelectedToken(nextToken);
      }
    },
    [stableflowTokens],
  );

  const handleQrTokenChange = useCallback(
    (token: StableflowDepositToken) => {
      qrTransitionStartedRef.current = false;
      setSelectedToken(token);
    },
    [],
  );

  const onContinueToAmount = async () => {
    if (!selectedToken) {
      return false;
    }

    setContinueLoading(true);

    try {
      // QA: Do not validate the amount when selecting a token
      const latestBalance = await getTokenBalance(selectedToken);

      if (depositMethod === "connected") {
        setAmount(
          buildDepositAmountFromMinUsd(
            selectedToken.minCheckoutUsd,
            latestBalance,
            prices,
            selectedToken,
          ),
        );
      } else if (Big(latestBalance || 0).gt(0)) {
        setAmount(
          buildDepositAmountFromMaxBalance(
            latestBalance,
            prices,
            selectedToken,
          ),
        );
      } else {
        setAmount(INITIAL_AMOUNT);
      }

      setStep("amount");
    } finally {
      setContinueLoading(false);
    }
  };

  const onContinueToConfirm = async () => {
    setContinueLoading(true);

    if (!selectedToken) {
      setContinueLoading(false);
      return false;
    }

    const latestBalance = await getTokenBalance(selectedToken);

    const effectiveMinUsd =
      depositMethod === "connected"
        ? getEffectiveMinDepositUsd(selectedToken.minCheckoutUsd)
        : 0;

    if (Big(amount.tokenAmount || 0).gt(latestBalance)) {
      toast.error(tDeposit("insufficientBalance"));
      setContinueLoading(false);
      return;
    }

    if (
      depositMethod === "connected" &&
      effectiveMinUsd > 0 &&
      Big(amount.amountUsd || 0).lt(effectiveMinUsd)
    ) {
      toast.error(
        tDeposit("minDepositAmount", {
          symbol: selectedToken.symbol,
          amount: `$${effectiveMinUsd}`,
        }),
      );
      setContinueLoading(false);
      return;
    }

    try {
      if (
        depositMethod === "stableflow" &&
        isStableflowDepositToken(selectedToken) &&
        session?.funderAddress
      ) {
        const amountBaseUnits = Big(amount.tokenAmount)
          .times(10 ** selectedToken.decimals)
          .toFixed(0, 0);
        const { quote } = await fetchJson<{ quote: QuoteResponse }>(
          "/api/trading/stableflow/quote",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              originAssetId: selectedToken.assetId,
              destinationAssetId: polygonUsdcDestinationAssetId,
              amountBaseUnits,
              refundTo: session.walletAddress,
              recipient: session.funderAddress
            })
          }
        );
        setStableflowQuote(quote);
      }

      setStep("confirm");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    } finally {
      setContinueLoading(false);
    }
  };

  const runStatusPolling = useCallback(
    async (execution: StableflowDepositContext) => {
      statusPollAbortRef.current?.abort();
      const controller = new AbortController();
      statusPollAbortRef.current = controller;

      try {
        if (!execution.skipBridgePoll && execution.depositAddress) {
          setStatusPhase("bridging");
          await pollStableflowBridge(
            execution.depositAddress,
            execution.depositMemo,
            (status: OneClickStatus) => {
              setBridgeStatusLabel(
                formatStableflowStatusLabel(status, tDeposit),
              );
            }
          );
        }

        setStatusPhase("awaiting_funds");
        const balancePayload = await pollFunderCollateralBalances(
          (balances) => {
            const mode = resolvePendingDepositConvertMode(balances);

            if (mode === "wrap-only") {
              setDetectedUsdceAmount(balances.usdce.balance);
              setDetectedUsdcAmount(undefined);
            } else if (mode === "full") {
              setDetectedUsdcAmount(balances.usdc.balance);
              setDetectedUsdceAmount(
                BigInt(balances.usdce.balanceBaseUnits || "0") > 0n
                  ? balances.usdce.balance
                  : undefined
              );
            }
          }
        );

        setFunderCollateralBalances(balancePayload);
        const readyMode = resolvePendingDepositConvertMode(balancePayload);

        if (readyMode === "wrap-only") {
          setDetectedUsdceAmount(balancePayload.usdce.balance);
          setDetectedUsdcAmount(undefined);
        } else if (readyMode === "full") {
          setDetectedUsdcAmount(balancePayload.usdc.balance);
          setDetectedUsdceAmount(
            BigInt(balancePayload.usdce.balanceBaseUnits || "0") > 0n
              ? balancePayload.usdce.balance
              : undefined
          );
        }

        setStableflowExecution((current) =>
          current
            ? {
              ...current,
              expectedAmountBaseUnits: minBaseUnits(
                current.expectedAmountBaseUnits,
                readyMode === "wrap-only"
                  ? balancePayload.usdce.balanceBaseUnits
                  : balancePayload.usdc.balanceBaseUnits
              )
            }
            : current
        );
        setStatusPhase("ready");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setStatusPhase("error");
        setStatusError(error instanceof Error ? error.message : String(error));
      }
    },
    [pollFunderCollateralBalances, pollStableflowBridge, tDeposit]
  );

  const transitionToStableflowStatus = useCallback(
    (quote: QuoteResponse) => {
      if (qrTransitionStartedRef.current) {
        return;
      }

      const depositAddress = quote.quote.depositAddress;

      if (!depositAddress) {
        return;
      }

      qrTransitionStartedRef.current = true;
      qrStatusPollAbortRef.current?.abort();
      qrStatusPollAbortRef.current = undefined;
      qrQuoteAbortRef.current?.abort();
      qrQuoteAbortRef.current = undefined;

      const execution: StableflowDepositContext = {
        quote,
        depositAddress,
        depositMemo: quote.quote.depositMemo,
        expectedAmountBaseUnits: qrQuoteAmountBaseUnitsRef.current,
        skipBridgePoll: false,
      };

      setStableflowExecution(execution);
      setStep("status");
      setStatusPhase("bridging");
      void runStatusPolling(execution);
    },
    [runStatusPolling],
  );

  const onContinueFromQr = useCallback(() => {
    if (!stableflowQuote) {
      return;
    }

    transitionToStableflowStatus(stableflowQuote);
  }, [stableflowQuote, transitionToStableflowStatus]);

  const stableflowQrTokenKey = isStableflowDepositToken(selectedToken)
    ? selectedToken.assetId
    : undefined;

  const stableflowAmountBaseUnits = useMemo(() => {
    if (!selectedToken) {
      return void 0;
    }
    return buildStableflowQrQuoteAmount(selectedToken as StableflowDepositToken, prices);
  }, [selectedToken, prices]);

  useEffect(() => {
    if (
      step !== "stableflow_qr" ||
      !selectedToken ||
      !isStableflowDepositToken(selectedToken) ||
      !session?.funderAddress ||
      !session?.walletAddress ||
      !polygonUsdcDestinationAssetId ||
      !loginMethod ||
      !stableflowAmountBaseUnits
    ) {
      return;
    }

    const token = selectedToken;
    const {
      amountBaseUnits,
      tokenAmount,
      amountUsd,
    } = stableflowAmountBaseUnits;

    qrQuoteAbortRef.current?.abort();
    const controller = new AbortController();
    qrQuoteAbortRef.current = controller;

    setStableflowQuoteLoading(true);
    setStableflowQuote(undefined);
    qrTransitionStartedRef.current = false;

    const quoteParams: any = {
      originAssetId: token.assetId,
      destinationAssetId: polygonUsdcDestinationAssetId,
      amountBaseUnits,
      refundTo: session.walletAddress,
      recipient: session.funderAddress,
    };

    if (["email", "google"].includes(loginMethod)) {
      quoteParams.swapType = "FLEX_INPUT";
    }

    void fetchJson<{ quote: QuoteResponse }>("/api/trading/stableflow/quote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(quoteParams),
      signal: controller.signal,
    })
      .then(({ quote }) => {
        if (controller.signal.aborted) {
          return;
        }

        qrQuoteAmountBaseUnitsRef.current = amountBaseUnits;
        setStableflowQuote(quote);
        setAmount({ tokenAmount, amountUsd });
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        const message = error instanceof Error ? error.message : String(error);
        toast.error(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setStableflowQuoteLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [
    polygonUsdcDestinationAssetId,
    session?.funderAddress,
    session?.walletAddress,
    stableflowQrTokenKey,
    step,
    selectedToken,
    loginMethod,
    stableflowAmountBaseUnits?.amountBaseUnits,
  ]);

  useEffect(() => {
    if (
      step !== "stableflow_qr" ||
      stableflowQuoteLoading ||
      !stableflowQuote?.quote.depositAddress
    ) {
      return;
    }

    const depositAddress = stableflowQuote.quote.depositAddress;
    const depositMemo = stableflowQuote.quote.depositMemo;
    const quote = stableflowQuote;

    qrStatusPollAbortRef.current?.abort();
    const controller = new AbortController();
    qrStatusPollAbortRef.current = controller;

    const fetchStatus = async (address: string, memo?: string) => {
      const search = new URLSearchParams({ depositAddress: address });

      if (memo) {
        search.set("depositMemo", memo);
      }

      const payload = await fetchJson<{ status: { status: OneClickStatus } }>(
        `/api/trading/stableflow/status?${search.toString()}`,
        { signal: controller.signal },
      );

      return payload.status;
    };

    void pollStableflowUntilDepositDetected({
      fetchStatus,
      depositAddress,
      depositMemo,
      signal: controller.signal,
    })
      .then(() => {
        if (!controller.signal.aborted) {
          transitionToStableflowStatus(quote);
        }
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      });

    return () => {
      controller.abort();
    };
  }, [
    step,
    stableflowQuote,
    stableflowQuoteLoading,
    transitionToStableflowStatus,
  ]);

  const onConfirmDeposit = async () => {
    if (!selectedToken || !session?.walletAddress) {
      return;
    }

    if (depositMethod === "connected") {
      setContinueLoading(true);

      try {
        if (selectedToken.chainType === FundingNetworkType.EVM) {
          await ensureFundingEvmChain(
            session.walletAddress,
            selectedToken.chainId
          );
        }

        const { txHash } = await depositViaPolygon(amount.tokenAmount, selectedToken);
        void reportFundingTransaction({
          type: "deposit",
          txHash,
          amount: amount.amountUsd
        });
        toast.success(tDeposit("depositSuccessful"));
        handleClose();
        syncCash();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        toast.error(message);
      } finally {
        setContinueLoading(false);
      }

      return;
    }

    if (
      !isStableflowDepositToken(selectedToken) ||
      !session.funderAddress ||
      !polygonUsdcDestinationAssetId
    ) {
      toast.error(tDeposit("stableflowNotReady"));
      return;
    }

    setContinueLoading(true);
    setStatusError(undefined);
    setStep("status");
    setStatusPhase("bridging");

    try {
      if (selectedToken.chainType === FundingNetworkType.EVM) {
        await ensureFundingEvmChain(
          session.walletAddress,
          selectedToken.chainId
        );
      }

      const execution = await depositViaStableflow(
        amount.tokenAmount,
        selectedToken,
        session.funderAddress,
        polygonUsdcDestinationAssetId
      );

      setStableflowExecution(execution);
      void runStatusPolling(execution);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusPhase("error");
      setStatusError(message);
      toast.error(message);
    } finally {
      setContinueLoading(false);
    }
  };

  const onConfirmPendingConvert = async () => {
    if (
      !session?.walletAddress ||
      !stableflowExecution ||
      !funderCollateralBalances ||
      !pendingConvertMode
    ) {
      return;
    }

    setContinueLoading(true);
    setStatusPhase("converting");
    setConvertStatusLabel(undefined);

    try {
      const amountUsd = getPendingConvertAmountUsd(
        funderCollateralBalances,
        pendingConvertMode
      );

      await executePendingDepositConvert({
        walletAddress: session.walletAddress,
        mode: pendingConvertMode,
        amountUsd,
        onStatus: setConvertStatusLabel
      });

      setStatusPhase("success");
      try {
        void reportFundingTransaction({
          type: "deposit",
          txHash: stableflowExecution.txHash ?? "",
          amount: amount.amountUsd
        });
      } catch { }

      try {
        await syncCash();
      } catch (syncError) {
        console.warn(
          "[deposit-dialog] syncCash after convert failed",
          syncError
        );
      }

      toast.success(tDeposit("depositSuccessful"));
      syncCash();
      handleClose();
      if (onDepositSuccess) {
        await onDepositSuccess();
      } else {
        await syncCash();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusPhase("error");
      setStatusError(message);
      toast.error(message);
    } finally {
      setContinueLoading(false);
    }
  };

  const handleEntryTabChange = async (nextTab: DepositEntryTab) => {
    setEntryTab(nextTab);

    if (nextTab === "private_balance") {
      try {
        await onAuthenticateConfidential();
        await confidentialAccount.refetch();
        await refreshPrivateBalance();
      } catch { }
    }
  };

  const privateAccountStatus = resolvePrivateAccountStatus(
    confidentialAccount.verified,
    privateBalance?.usd,
  );

  const entryModalMinHeight = useMemo(() => {
    if (isMobile) {
      return undefined;
    }

    if (step !== "entry") {
      return undefined;
    }

    if (entryTab === "crypto") {
      return `${DEPOSIT_ENTRY_MODAL_MIN_HEIGHT.crypto} pb-3`;
    }

    if (entryTab === "private_balance") {
      return privateAccountStatus === "not_created"
        ? DEPOSIT_ENTRY_MODAL_MIN_HEIGHT.privateBalanceNotCreated
        : DEPOSIT_ENTRY_MODAL_MIN_HEIGHT.privateBalance;
    }

    return DEPOSIT_ENTRY_MODAL_MIN_HEIGHT.crypto;
  }, [entryTab, isMobile, privateAccountStatus, step]);

  const footer = useMemo(() => {
    if (step === "status") {
      return undefined;
    }

    if (
      step === "entry" &&
      entryTab === "private_balance" &&
      privateAccountStatus === "not_created"
    ) {
      return (
        <button
          type="button"
          className={depositPrivateFooterLinkClass}
          onClick={() => {
            handleClose();
            onOpenPrivateTopup?.();
          }}
        >
          {tWallet("privateBalance")}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      );
    }

    if (step === "entry") {
      return undefined;
    }

    if (step === "stableflow_qr") {
      const canContinue =
        !!stableflowQuote?.quote.depositAddress && !stableflowQuoteLoading;

      return (
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          disabled={!canContinue || continueLoading}
          onClick={() => onContinueFromQr()}
        >
          {continueLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {tAuth("continue")}
        </button>
      );
    }

    if (step === "tokens") {
      const canContinue = !!selectedToken;

      return (
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          disabled={!canContinue || continueLoading}
          onClick={() => void onContinueToAmount()}
        >
          {continueLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {tAuth("continue")}
        </button>
      );
    }

    if (step === "amount" && selectedToken) {
      return (
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          disabled={continueLoading}
          onClick={() => void onContinueToConfirm()}
        >
          {continueLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {tAuth("continue")}
        </button>
      );
    }

    if (step === "confirm") {
      return (
        <button
          type="button"
          className={fundingPrimaryButtonClass}
          disabled={continueLoading}
          onClick={() => void onConfirmDeposit()}
        >
          {continueLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {tCommon("confirm")}
        </button>
      );
    }

    return undefined;
  }, [
    amount,
    continueLoading,
    depositMethod,
    entryTab,
    handleClose,
    onConfirmDeposit,
    onContinueFromQr,
    onContinueToAmount,
    onContinueToConfirm,
    onOpenPrivateTopup,
    privateAccountStatus,
    selectedToken,
    selectedTokenMaxAmount,
    stableflowQuote,
    stableflowQuoteLoading,
    step,
    tAuth,
    tCommon,
    tWallet,
  ]);

  return (
    <FundingResponsiveOverlay
      open={open}
      onClose={handleClose}
      ariaLabel={ariaLabel}
      className={modalWidth}
      hideCloseButton
      overlayCloseable={false}
    >
      <DepositProvider
        value={{
          depositMethod,
          selectableTokens,
          funderAddress: session?.funderAddress,
          supportedAssets: selectableTokens,
          balancesLoading,
          pricesLoading,
          hasPendingDeposit,
          converting: pendingConverting,
          onConfirmPendingDeposit: onConfirmPendingDepositFromEntry,
        }}
      >
        <FundingModalShell
          title={tPortfolio("depositLabel")}
          onClose={handleClose}
          onBack={showBack ? handleBack : undefined}
          footer={footer}
          className={
            step === "entry" && entryModalMinHeight
              ? entryModalMinHeight
              : step === "confirm"
                ? "min-h-0 md:min-h-[600px]"
                : step === "entry"
                  ? (isMobile ? "min-h-0" : DEPOSIT_ENTRY_MODAL_MIN_HEIGHT.crypto)
                  : step === "stableflow_qr"
                    ? "min-h-0 md:min-h-[600px]"
                    : "min-h-0 md:min-h-[515px]"
          }
        >
          {step === "entry" ? (
            <DepositEntryStep
              entryTab={entryTab}
              onEntryTabChange={handleEntryTabChange}
              onSelectConnected={() => {
                setDepositMethod("connected");
                setStep("tokens");
              }}
              onSelectStableflow={() => void onSelectStableflow()}
              stableflowLoading={stableflowTokensLoading}
              onOpenPrivateTopup={() => {
                handleClose();
                onOpenPrivateTopup?.();
              }}
              onClose={handleClose}
            />
          ) : null}

          {step === "stableflow_qr" ? (
            <DepositStableflowQrStep
              stableflowTokens={stableflowTokens}
              selectedChain={qrSelectedChain}
              selectedToken={
                isStableflowDepositToken(selectedToken)
                  ? selectedToken
                  : undefined
              }
              quoteLoading={stableflowQuoteLoading}
              tokensLoading={stableflowTokensLoading}
              depositAddress={stableflowQuote?.quote.depositAddress}
              onChainChange={handleQrChainChange}
              onTokenChange={handleQrTokenChange}
            />
          ) : null}

          {step === "tokens" ? (
            <DepositTokenStep
              selectedToken={selectedToken}
              onSelectToken={setSelectedToken}
            />
          ) : null}

          {step === "amount" && selectedToken ? (
            <DepositAmountStep
              key={`${selectedToken.chainId}-${selectedToken.address}`}
              token={selectedToken}
              amount={amount}
              maxAmount={selectedTokenMaxAmount}
              minDepositUsd={
                depositMethod === "stableflow"
                  ? 0
                  : getEffectiveMinDepositUsd(selectedToken.minCheckoutUsd)
              }
              onAmountChange={setAmount}
            />
          ) : null}

          {step === "confirm" && selectedToken ? (
            <DepositConfirmStep
              walletAddress={session?.walletAddress ?? ""}
              token={selectedToken}
              amount={amount.tokenAmount}
              amountUsd={amount.amountUsd}
              quoteMode={
                depositMethod === "stableflow" ? "stableflow" : "bridge"
              }
              stableflowQuote={stableflowQuote}
              recipientAddress={session?.funderAddress}
            />
          ) : null}

          {step === "status" && session?.funderAddress ? (
            <DepositStatusStep
              phase={statusPhase}
              funderAddress={session.funderAddress}
              pendingConvertMode={pendingConvertMode}
              detectedUsdcAmount={detectedUsdcAmount}
              detectedUsdceAmount={detectedUsdceAmount}
              bridgeStatusLabel={bridgeStatusLabel}
              convertStatusLabel={convertStatusLabel}
              error={statusError}
              convertLoading={continueLoading}
              onConfirmConvert={onConfirmPendingConvert}
              onClose={handleClose}
            />
          ) : null}
        </FundingModalShell>
      </DepositProvider>
    </FundingResponsiveOverlay>
  );
}

function minBaseUnits(expected: string, actual: string): string {
  try {
    const expectedValue = BigInt(expected || "0");
    const actualValue = BigInt(actual || "0");

    if (actualValue === 0n) {
      return expected;
    }

    return actualValue < expectedValue ? actual.toString() : expected;
  } catch {
    return expected;
  }
}
