"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getOutcomeProbability } from "@/lib/market/game-market-snapshot";
import {
  findGameMarketOutcome,
  resolveGameOutcomeTradePrice
} from "@/lib/market/game-outcome-price";
import { calculateReferencePrice } from "@/lib/market/order-math";
import {
  formatOrderToastSummary,
  resolveOrderErrorMessage,
  showOrderErrorToast,
  showOrderSubmittedToast
} from "@/lib/trading/order-toast";
import { useAuth } from "@/context/auth";
import {
  useSetTradeAmount,
  useSetTradeLimitPrice,
  useSetTradeOutcomeSide,
  useTradeAmount,
  useTradeLimitPrice,
  useTradeMatchOutcomeSide,
  useTradeOrderMode,
  useTradeOutcomeSide,
  useTradeTab
} from "@/store/trade-ticket-store";
import type { GameMarketSnapshot, TeamMarketSnapshot } from "@/types/market";
import {
  buildGameTradePreview,
  buildTeamTradePreview,
  buildGameUserOrderPreview,
  buildTeamUserOrderPreview,
  canSubmitTradeTicket,
  deriveTradeActionLabel,
  ensureTradingReadyForBid,
  fetchReadinessForPreview,
  fetchTradingConfig,
  formatGameDefaultLimitPriceString,
  formatTeamDefaultLimitPriceString,
  getGameDefaultLimitPrice,
  getTeamDefaultLimitPrice,
  isEligibilityNetworkFailure,
  parseLimitPriceInput,
  parseOrderAmount,
  refreshTradingEligibility,
  resolveOrderLimitPrice,
  resolveOrderType,
  resolveQuickAmountAllBalance,
  resolveTradeSide,
  submitSignedTradeOrder,
  toBidOrderPreview,
  type TradeTicketStatus,
  type TradingConfig
} from "@/views/trade/trade-widget/trade-ticket-helpers";

export type UseTradeTicketTeamInput = {
  variant: "team";
  snapshot: TeamMarketSnapshot;
};

export type UseTradeTicketGameInput = {
  variant: "game";
  gameSnapshot: GameMarketSnapshot;
};

export type UseTradeTicketInput =
  | UseTradeTicketTeamInput
  | UseTradeTicketGameInput;

export function useTradeTicket(input: UseTradeTicketInput) {
  const router = useRouter();
  const {
    session,
    isAuthenticated,
    readiness: authReadiness,
    openLogin,
    signClobCredentials,
    signTokenApprovals,
    refreshSetupReadiness
  } = useAuth();

  const tab = useTradeTab();
  const tradeSide = resolveTradeSide(tab);
  const outcomeSide = useTradeOutcomeSide();
  const matchOutcomeSide = useTradeMatchOutcomeSide();
  const orderMode = useTradeOrderMode();
  const amount = useTradeAmount();
  const limitPrice = useTradeLimitPrice();
  const setOutcomeSide = useSetTradeOutcomeSide();
  const setAmount = useSetTradeAmount();
  const setLimitPrice = useSetTradeLimitPrice();

  const [readiness, setReadiness] = useState<
    Awaited<ReturnType<typeof fetchReadinessForPreview>> | undefined
  >();
  const [config, setConfig] = useState<TradingConfig | undefined>();
  const [status, setStatus] = useState<TradeTicketStatus>("idle");
  const [message, setMessage] = useState<string | undefined>();
  const [eligibilityRetryAvailable, setEligibilityRetryAvailable] =
    useState(false);

  const orderAmount = parseOrderAmount(amount);
  const orderType = resolveOrderType(orderMode);

  const limitPriceContextKey =
    input.variant === "team"
      ? `team:${input.snapshot.team.id}:${outcomeSide}:${tradeSide}`
      : `game:${input.gameSnapshot.match.id}:${matchOutcomeSide}:${outcomeSide}:${tradeSide}`;

  const teamDefaults = useMemo(() => {
    if (input.variant !== "team") {
      return undefined;
    }

    const snapshot = input.snapshot;
    const defaultLimit = getTeamDefaultLimitPrice(
      snapshot,
      outcomeSide,
      tradeSide
    );
    const orderLimitPrice = resolveOrderLimitPrice(
      orderMode,
      parseLimitPriceInput(limitPrice, defaultLimit),
      defaultLimit
    );

    const preview = buildTeamTradePreview({
      snapshot,
      outcomeSide,
      tradeSide,
      amount: orderAmount,
      limitPrice: orderLimitPrice,
      orderType
    });

    const yesTokenPrice =
      snapshot.market.polymarket?.tokens.yes?.price ??
      calculateReferencePrice(snapshot.market.probability, "yes");
    const noTokenPrice =
      snapshot.market.polymarket?.tokens.no?.price ??
      calculateReferencePrice(snapshot.market.probability, "no");

    return {
      snapshot,
      preview,
      yesPrice: snapshot.market.probability,
      noPrice: Math.max(0, 100 - snapshot.market.probability),
      yesTokenPrice,
      noTokenPrice,
      defaultLimit,
      orderLimitPrice
    };
  }, [
    input,
    orderAmount,
    orderMode,
    orderType,
    outcomeSide,
    limitPrice,
    tradeSide
  ]);

  const gameDefaults = useMemo(() => {
    if (input.variant !== "game") {
      return undefined;
    }

    const gameSnapshot = input.gameSnapshot;
    const matchProbability = getOutcomeProbability(
      gameSnapshot,
      matchOutcomeSide
    );
    const defaultLimit = getGameDefaultLimitPrice(
      gameSnapshot,
      matchOutcomeSide,
      outcomeSide,
      tradeSide
    );
    const orderLimitPrice = resolveOrderLimitPrice(
      orderMode,
      parseLimitPriceInput(limitPrice, defaultLimit),
      defaultLimit
    );

    const gamePreview = buildGameTradePreview({
      gameSnapshot,
      matchOutcomeSide,
      binarySide: outcomeSide,
      tradeSide,
      amount: orderAmount,
      limitPrice: orderLimitPrice,
      orderType
    });
    const preview = toBidOrderPreview(gamePreview);
    const matchOutcome = findGameMarketOutcome(
      gameSnapshot.outcomes,
      matchOutcomeSide
    );

    return {
      gameSnapshot,
      gamePreview,
      preview,
      yesPrice: matchProbability,
      noPrice: Math.max(0, 100 - matchProbability),
      yesTokenPrice: resolveGameOutcomeTradePrice(
        matchOutcome,
        matchProbability,
        "yes",
        tradeSide
      ),
      noTokenPrice: resolveGameOutcomeTradePrice(
        matchOutcome,
        matchProbability,
        "no",
        tradeSide
      ),
      defaultLimit,
      orderLimitPrice
    };
  }, [
    input,
    matchOutcomeSide,
    orderAmount,
    orderMode,
    orderType,
    outcomeSide,
    limitPrice,
    tradeSide
  ]);

  const preview = teamDefaults?.preview ?? gameDefaults?.preview;
  const previewCanSubmit = preview?.canSubmitRealOrder ?? false;

  const actionInProgress =
    status === "loading" || status === "signing" || status === "submitting";

  const canSubmit = canSubmitTradeTicket({
    status,
    previewCanSubmit: Boolean(preview)
  });

  const actionLabel = deriveTradeActionLabel(
    tradeSide,
    outcomeSide,
    input.variant
  );

  useEffect(() => {
    if (input.variant === "team") {
      setLimitPrice(
        formatTeamDefaultLimitPriceString(
          input.snapshot,
          outcomeSide,
          tradeSide
        )
      );
      return;
    }

    setLimitPrice(
      formatGameDefaultLimitPriceString(
        input.gameSnapshot,
        matchOutcomeSide,
        outcomeSide,
        tradeSide
      )
    );
    // Reset default limit price only when trade context changes, not on snapshot refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshot read from latest closure
  }, [limitPriceContextKey, setLimitPrice]);

  useEffect(() => {
    let ignore = false;

    async function loadTicketState() {
      setStatus("loading");

      try {
        const loadedConfig = await fetchTradingConfig();

        if (!ignore) {
          setConfig(loadedConfig);
          setStatus("idle");
        }
      } catch (error) {
        if (!ignore) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : String(error));
        }
      }
    }

    void loadTicketState();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!preview) {
      return undefined;
    }

    const orderPreview = preview;
    let ignore = false;

    async function loadReadiness() {
      try {
        const nextReadiness = await fetchReadinessForPreview(
          orderPreview,
          tradeSide
        );

        if (!ignore) {
          setReadiness(nextReadiness);
        }
      } catch (error) {
        if (!ignore) {
          setMessage(error instanceof Error ? error.message : String(error));
        }
      }
    }

    void loadReadiness();

    return () => {
      ignore = true;
    };
  }, [
    preview?.estimatedCost,
    preview?.estimatedTakerFee,
    preview?.estimatedTotalCost,
    preview?.shareSize,
    preview?.sidePrice,
    preview?.tokenId,
    tradeSide
  ]);

  const refreshOrderReadiness = useCallback(async () => {
    if (!preview) {
      return undefined;
    }

    const nextReadiness = await fetchReadinessForPreview(preview, tradeSide);
    setReadiness(nextReadiness);
    setEligibilityRetryAvailable(isEligibilityNetworkFailure(nextReadiness));
    return nextReadiness;
  }, [preview, tradeSide]);

  const handleRetryEligibility = useCallback(async () => {
    setStatus("loading");
    setMessage("Checking Polymarket trading eligibility...");

    try {
      await refreshTradingEligibility();
      const nextReadiness = await refreshOrderReadiness();
      const stillBlocked = isEligibilityNetworkFailure(nextReadiness);

      setEligibilityRetryAvailable(stillBlocked);
      setStatus(stillBlocked ? "error" : "idle");
      const blockedMessage = stillBlocked
        ? nextReadiness?.checks.find((check) => check.id === "eligibility")
            ?.detail
        : undefined;
      setMessage(blockedMessage);
      if (blockedMessage) {
        showOrderErrorToast(blockedMessage);
      }
    } catch (error) {
      setEligibilityRetryAvailable(true);
      setStatus("error");
      setMessage(resolveOrderErrorMessage(error));
      showOrderErrorToast(error);
    }
  }, [refreshOrderReadiness]);

  const handleSubmit = useCallback(async () => {
    if (!preview || actionInProgress) {
      return;
    }

    setMessage(undefined);

    const gate = await ensureTradingReadyForBid({
      session,
      authReadiness,
      orderReadiness: readiness,
      previewCanSubmit,
      previewDisabledReason: preview.disabledReason,
      openLogin,
      signClobCredentials,
      signTokenApprovals,
      refreshSetupReadiness
    });

    if (!gate.ok) {
      if (gate.action === "show_error" || gate.action === "retry_eligibility") {
        setStatus("error");
        setMessage(gate.message);
        setEligibilityRetryAvailable(gate.action === "retry_eligibility");
        showOrderErrorToast(gate.message);
      } else {
        setStatus("idle");
        setMessage(gate.message);
        setEligibilityRetryAvailable(false);
        await refreshOrderReadiness();
      }

      return;
    }

    setEligibilityRetryAvailable(false);
    setReadiness(gate.readiness);

    if (!session?.funderAddress || !preview.tokenId) {
      const missingSessionMessage =
        "A connected wallet, deployed deposit wallet, and Polymarket token are required.";
      setStatus("error");
      setMessage(missingSessionMessage);
      showOrderErrorToast(missingSessionMessage);
      return;
    }

    setStatus("signing");
    setMessage("Review and sign the Polymarket order in your wallet.");

    try {
      let userOrderPreview;

      if (input.variant === "team") {
        userOrderPreview = buildTeamUserOrderPreview(input.snapshot, preview);
      } else if (!gameDefaults) {
        throw new Error("Game market preview is unavailable.");
      } else {
        userOrderPreview = buildGameUserOrderPreview(
          input.gameSnapshot,
          gameDefaults.gamePreview
        );
      }

      setStatus("submitting");
      setMessage("Submitting signed order to Polymarket CLOB.");

      const result = await submitSignedTradeOrder({
        session,
        preview,
        orderType,
        userOrderPreview
      });

      showOrderSubmittedToast(
        formatOrderToastSummary({
          tradeSide: preview.tradeSide,
          outcomeSide: preview.outcomeSide,
          estimatedTotalCost: preview.estimatedTotalCost,
          shareSize: preview.shareSize,
          variant: input.variant
        }),
        {
          orderId: result.order?.id,
          onViewPortfolio: () => router.push("/portfolio")
        }
      );
      setStatus("idle");
      setMessage(undefined);
      await refreshOrderReadiness();
    } catch (error) {
      const errorMessage = resolveOrderErrorMessage(error);
      setStatus("error");
      setMessage(errorMessage);
      showOrderErrorToast(error);
    }
  }, [
    actionInProgress,
    authReadiness,
    gameDefaults?.orderLimitPrice,
    input,
    matchOutcomeSide,
    openLogin,
    orderAmount,
    orderType,
    outcomeSide,
    preview,
    previewCanSubmit,
    readiness,
    refreshOrderReadiness,
    refreshSetupReadiness,
    router,
    session,
    signClobCredentials,
    signTokenApprovals,
    tradeSide
  ]);

  function applyQuickAmount(value: number | "all") {
    if (value === "all") {
      const balance = resolveQuickAmountAllBalance(readiness, tradeSide);

      if (balance !== undefined && balance > 0) {
        setAmount(
          tradeSide === "sell" ? String(balance) : String(Math.floor(balance))
        );
      }

      return;
    }

    setAmount(String(value));
    setMessage(undefined);
    setEligibilityRetryAvailable(false);
  }

  function selectOutcome(side: typeof outcomeSide) {
    setOutcomeSide(side);
    setMessage(undefined);
    setEligibilityRetryAvailable(false);
  }

  if (!preview) {
    return null;
  }

  const display = teamDefaults ?? gameDefaults;
  if (!display) {
    return null;
  }

  return {
    formProps: {
      yesTokenPrice: display.yesTokenPrice,
      noTokenPrice: display.noTokenPrice,
      yesProbability: display.yesPrice,
      noProbability: display.noPrice,
      outcomeSide,
      orderMode,
      tradeSide,
      amount,
      limitPrice,
      preview,
      actionLabel,
      canSubmit,
      actionInProgress,
      isAuthenticated,
      status,
      message,
      eligibilityRetryAvailable,
      onSelectOutcome: selectOutcome,
      onAmountChange: setAmount,
      onLimitPriceChange: setLimitPrice,
      onQuickAmount: applyQuickAmount,
      onSubmit: handleSubmit,
      onRetryEligibility: handleRetryEligibility,
      onLoginStart: () => {
        setMessage(undefined);
        setEligibilityRetryAvailable(false);
      },
      onLoginSuccess: async () => {
        await refreshOrderReadiness();
        setStatus("idle");
      },
      onLoginError: (error: Error) => {
        setStatus("error");
        setMessage(error.message);
      },
      onAmountMessageClear: () => {
        setMessage(undefined);
        setEligibilityRetryAvailable(false);
      }
    }
  };
}
