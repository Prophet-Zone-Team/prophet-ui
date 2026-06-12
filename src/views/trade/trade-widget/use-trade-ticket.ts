"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { resolveTradeTicketAvailableCash } from "@/lib/trading/cash-balance-model";
import { fireBasicConfettiFromElement } from "@/lib/confetti/fire-basic-cannon";
import { postCollateralBalanceSync } from "@/lib/trading/sync-collateral-balance";
import {
  resolveTradePrimaryAction,
  runTradePrimaryAction
} from "@/lib/trading/trade-primary-action";

import { getDefaultFixtureLimitPrice } from "@/lib/market/game-order";
import { mergeFixtureOutcomeLiveAsks } from "@/lib/market/fixture-ask-liquidity";
import { useMarketWsPrices } from "@/context/market-ws";
import { getOutcomeProbability } from "@/lib/market/game-market-snapshot";
import {
  findGameMarketOutcome,
  resolveGameOutcomeTradePrice
} from "@/lib/market/game-outcome-price";
import {
  calculateReferencePrice,
  isTakeProfitLimitAvailable,
  LIMIT_BUY_MIN_SHARES,
  resolveMaxSellShares
} from "@/lib/market/order-math";
import type { BidOrderPreview } from "@/lib/market/polymarket-order";
import {
  formatOrderToastSummary,
  resolveOrderErrorMessage,
  showOrderErrorToast,
  showOrderSubmittedToast
} from "@/lib/trading/order-toast";
import { useAuth } from "@/context/auth";
import {
  useSetTradeAmount,
  useSetTradeLimitExpiration,
  useSetTradeLimitExpirationCustom,
  useSetTradeLimitPrice,
  useSetTradeOutcomeSide,
  useSetTradeTakeProfitLimitEnabled,
  useSetTradeTakeProfitLimitPrice,
  useTradeAmount,
  useTradeLimitExpiration,
  useTradeLimitExpirationCustom,
  useTradeLimitPrice,
  useTradeMatchOutcomeSide,
  useSelectedFixtureOutcome,
  useTradeOrderMode,
  useTradeOutcomeSide,
  useTradeTab,
  useTradeTakeProfitLimitEnabled,
  useTradeTakeProfitLimitPrice
} from "@/store/trade-ticket-store";
import type {
  GameMarketSnapshot,
  TeamMarketSnapshot,
  UserPositionRecord
} from "@/types/market";
import {
  trackEligibilityCheckCompleted,
  trackOrderConfirmClicked,
  trackOrderInputChanged,
  trackOrderPreviewCompleted,
  trackOrderPreviewRequested,
  trackOrderSubmitFailed,
  trackOrderSubmitStarted,
  trackOrderSubmitSucceeded
} from "@/lib/analytics/tracking";
import { resolveTradeAnalyticsContext } from "@/lib/analytics/tracking/resolve-trade-context";
import { resolveOutcomeSideForPosition } from "@/lib/portfolio/portfolio-metrics";
import { reportTradeOrderTransaction } from "@/lib/portfolio/user";
import {
  buildGameTradePreview,
  buildPreviewBalancesQueryKey,
  buildTeamTradePreview,
  buildGameUserOrderPreview,
  buildTakeProfitOrderBundle,
  buildTeamUserOrderPreview,
  buildOutcomeShareMap,
  canSubmitTradeTicket,
  ensureTradingReadyForBid,
  fetchConditionalTokenBalance,
  fetchMarketAcceptingOrders,
  fetchMarketOutcomeShares,
  fetchReadinessForPreview,
  formatGameDefaultLimitPriceString,
  formatTeamDefaultLimitPriceString,
  getGameDefaultLimitPrice,
  getTeamDefaultLimitPrice,
  isEligibilityNetworkFailure,
  parseLimitPriceInput,
  parseOrderAmount,
  refreshTradingEligibility,
  resolveGameOutcomeTokenIds,
  resolveOrderLimitPrice,
  resolveOrderType,
  formatMarketBuyAmountInput,
  resolveMarketBuyAllInAmount,
  resolveQuickAmountAllBalance,
  resolveSellQuickAmount,
  resolveTakeProfitLimitPrice,
  resolveTeamOutcomeTokenIds,
  resolveTradeSide,
  submitSignedTradeOrder,
  submitTakeProfitLimitOrder,
  toBidOrderPreview,
  resolveLimitShareQuickAmount,
  resolveLimitExpirationTimestamp,
  type OutcomeShareMap,
  type SellQuickAmountFraction,
  type TradeTicketStatus
} from "@/views/trade/trade-widget/trade-ticket-helpers";
import {
  resolveTradeActionLabel,
  resolveTradePrimaryActionLabel,
  translateTradeMessage,
  validateLimitExpirationCustom
} from "@/views/trade/trade-widget/trade-i18n";
import { TRADE_BID_BUTTON_ID } from "@/views/trade/trade-widget/trade-ui";

export type UseTradeTicketTeamInput = {
  variant: "team";
  snapshot: TeamMarketSnapshot;
  sellPosition?: UserPositionRecord;
  onOrderSuccess?: () => void | Promise<void>;
};

export type UseTradeTicketGameInput = {
  variant: "game";
  gameSnapshot: GameMarketSnapshot;
  sellPosition?: UserPositionRecord;
  onOrderSuccess?: () => void | Promise<void>;
};

export type UseTradeTicketInput =
  | UseTradeTicketTeamInput
  | UseTradeTicketGameInput;

/** Collapse mount-time preview/auth churn into a single balances request. */
const READINESS_FETCH_DEBOUNCE_MS = 500;

export function useTradeTicket(input: UseTradeTicketInput) {
  const t = useTranslations("trade");
  const router = useRouter();
  const {
    session,
    isAuthenticated,
    readiness: authReadiness,
    isRegionBlocked,
    isBuyRestricted,
    isRegionCloseOnly,
    openLogin,
    signClobCredentials,
    signTokenApprovals,
    refreshSetupReadiness
  } = useAuth();

  const tab = useTradeTab();
  const tradeSide = resolveTradeSide(tab);
  const outcomeSide = useTradeOutcomeSide();
  const matchOutcomeSide = useTradeMatchOutcomeSide();
  const selectedFixtureOutcome = useSelectedFixtureOutcome();
  const orderMode = useTradeOrderMode();
  const amount = useTradeAmount();
  const limitPrice = useTradeLimitPrice();
  const limitExpiration = useTradeLimitExpiration();
  const limitExpirationCustom = useTradeLimitExpirationCustom();
  const takeProfitLimitEnabled = useTradeTakeProfitLimitEnabled();
  const takeProfitLimitPrice = useTradeTakeProfitLimitPrice();
  const setOutcomeSide = useSetTradeOutcomeSide();
  const setAmount = useSetTradeAmount();
  const setLimitPrice = useSetTradeLimitPrice();
  const setLimitExpiration = useSetTradeLimitExpiration();
  const setLimitExpirationCustom = useSetTradeLimitExpirationCustom();
  const setTakeProfitLimitEnabled = useSetTradeTakeProfitLimitEnabled();
  const setTakeProfitLimitPrice = useSetTradeTakeProfitLimitPrice();

  const [readiness, setReadiness] = useState<
    Awaited<ReturnType<typeof fetchReadinessForPreview>> | undefined
  >();
  const [status, setStatus] = useState<TradeTicketStatus>("idle");
  const [message, setMessage] = useState<string | undefined>();
  const [eligibilityRetryAvailable, setEligibilityRetryAvailable] =
    useState(false);
  const [positionAcceptingOrders, setPositionAcceptingOrders] = useState<
    boolean | undefined
  >();
  const [outcomeShares, setOutcomeShares] = useState<OutcomeShareMap>({
    yes: 0,
    no: 0
  });
  const readinessFetchGeneration = useRef(0);
  const lastFetchedReadinessKeyRef = useRef<string | null>(null);
  const previewForReadinessRef = useRef<BidOrderPreview | undefined>(undefined);
  const authReadinessRef = useRef(authReadiness);
  const sessionRef = useRef(session);
  useEffect(() => {
    authReadinessRef.current = authReadiness;
  }, [authReadiness]);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);
  useEffect(() => {
    return () => {
      lastFetchedReadinessKeyRef.current = null;
    };
  }, []);
  const orderAmount = parseOrderAmount(amount);
  const limitExpirationTimestamp =
    orderMode === "limit"
      ? resolveLimitExpirationTimestamp(limitExpiration, limitExpirationCustom)
      : undefined;
  const orderType = resolveOrderType(orderMode, limitExpirationTimestamp);

  const marketTokenDeps =
    input.variant === "team"
      ? [
          input.snapshot.team.id,
          input.snapshot.market.polymarket?.conditionId,
          input.snapshot.market.polymarket?.tokens.yes?.tokenId,
          input.snapshot.market.polymarket?.tokens.no?.tokenId
        ].join("|")
      : [
          input.gameSnapshot.match.id,
          selectedFixtureOutcome?.id,
          selectedFixtureOutcome?.conditionId,
          selectedFixtureOutcome?.tokenId,
          selectedFixtureOutcome?.noTokenId,
          findGameMarketOutcome(input.gameSnapshot.outcomes, matchOutcomeSide)
            ?.tokenId,
          findGameMarketOutcome(input.gameSnapshot.outcomes, matchOutcomeSide)
            ?.noTokenId
        ].join("|");

  const marketTokenIds = useMemo(() => {
    if (input.variant === "team") {
      return resolveTeamOutcomeTokenIds(input.snapshot);
    }

    return resolveGameOutcomeTokenIds(
      input.gameSnapshot,
      matchOutcomeSide,
      selectedFixtureOutcome
    );
  }, [
    input.variant,
    matchOutcomeSide,
    marketTokenDeps,
    selectedFixtureOutcome
  ]);

  const fixtureWsEnabled =
    input.variant === "game" && Boolean(selectedFixtureOutcome);

  const { pricesByTokenId: fixtureTokenPrices } = useMarketWsPrices(
    fixtureWsEnabled
      ? [selectedFixtureOutcome?.tokenId, selectedFixtureOutcome?.noTokenId]
      : []
  );

  const liveFixtureAsks = useMemo(() => {
    if (input.variant !== "game" || !selectedFixtureOutcome) {
      return undefined;
    }

    const yesAsk = selectedFixtureOutcome.tokenId
      ? fixtureTokenPrices[selectedFixtureOutcome.tokenId]?.bestAsk
      : undefined;
    const noAsk = selectedFixtureOutcome.noTokenId
      ? fixtureTokenPrices[selectedFixtureOutcome.noTokenId]?.bestAsk
      : undefined;

    if (yesAsk === undefined && noAsk === undefined) {
      return undefined;
    }

    return { yesAsk, noAsk };
  }, [fixtureTokenPrices, input.variant, selectedFixtureOutcome]);

  const effectiveFixtureOutcome = useMemo(() => {
    if (!selectedFixtureOutcome) {
      return undefined;
    }

    return mergeFixtureOutcomeLiveAsks(selectedFixtureOutcome, liveFixtureAsks);
  }, [liveFixtureAsks, selectedFixtureOutcome]);

  const { conditionId, yesTokenId, noTokenId } = marketTokenIds;

  const teamWsEnabled =
    input.variant === "team" && Boolean(yesTokenId || noTokenId);

  const { pricesByTokenId: teamTokenPrices } = useMarketWsPrices(
    teamWsEnabled ? [yesTokenId, noTokenId] : []
  );

  const sellPosition = input.sellPosition;

  const maxSellShares = useMemo(() => {
    if (tradeSide !== "sell") {
      return undefined;
    }

    const positionSize =
      sellPosition?.size ??
      (outcomeShares[outcomeSide] > 0 ? outcomeShares[outcomeSide] : undefined);

    return resolveMaxSellShares(
      positionSize,
      readiness?.balances?.conditionalTokenBalance
    );
  }, [
    outcomeShares,
    outcomeSide,
    readiness?.balances?.conditionalTokenBalance,
    sellPosition?.size,
    tradeSide
  ]);

  const availableShares =
    tradeSide === "sell" ? (maxSellShares ?? 0) : outcomeShares[outcomeSide];

  const cappedOrderAmount =
    maxSellShares !== undefined
      ? Math.min(orderAmount, maxSellShares)
      : orderAmount;

  const sellAcceptingOrders = useMemo(() => {
    if (!sellPosition || tradeSide !== "sell") {
      return undefined;
    }

    return positionAcceptingOrders;
  }, [positionAcceptingOrders, sellPosition, tradeSide]);

  const limitPriceContextKey =
    input.variant === "team"
      ? `team:${input.snapshot.team.id}:${outcomeSide}:${tradeSide}`
      : `game:${input.gameSnapshot.match.id}:${selectedFixtureOutcome?.id ?? matchOutcomeSide}:${outcomeSide}:${tradeSide}`;

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
      amount: cappedOrderAmount,
      limitPrice: orderLimitPrice,
      orderType,
      tokenId:
        sellPosition && tradeSide === "sell" ? sellPosition.asset : undefined,
      maxShareSize: maxSellShares,
      acceptingOrders: sellAcceptingOrders
    });

    const yesTokenPrice =
      (yesTokenId ? teamTokenPrices[yesTokenId]?.bestAsk : undefined) ??
      snapshot.market.polymarket?.tokens.yes?.price ??
      calculateReferencePrice(snapshot.market.probability, "yes");
    const noTokenPrice =
      (noTokenId ? teamTokenPrices[noTokenId]?.bestAsk : undefined) ??
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
    cappedOrderAmount,
    input,
    maxSellShares,
    noTokenId,
    orderMode,
    orderType,
    outcomeSide,
    limitPrice,
    sellAcceptingOrders,
    sellPosition,
    teamTokenPrices,
    tradeSide,
    yesTokenId
  ]);

  const gameDefaults = useMemo(() => {
    if (input.variant !== "game") {
      return undefined;
    }

    const gameSnapshot = input.gameSnapshot;
    const matchProbability = effectiveFixtureOutcome
      ? effectiveFixtureOutcome.probability
      : getOutcomeProbability(gameSnapshot, matchOutcomeSide);
    const defaultLimit = effectiveFixtureOutcome
      ? getDefaultFixtureLimitPrice(
          effectiveFixtureOutcome,
          outcomeSide,
          tradeSide
        )
      : getGameDefaultLimitPrice(
          gameSnapshot,
          matchOutcomeSide,
          outcomeSide,
          tradeSide
        );
    const orderLimitPrice = resolveOrderLimitPrice(
      orderMode,
      parseLimitPriceInput(limitPrice, defaultLimit ?? 0),
      defaultLimit ?? 0
    );

    const gamePreview = buildGameTradePreview({
      gameSnapshot,
      matchOutcomeSide,
      binarySide: outcomeSide,
      tradeSide,
      amount: cappedOrderAmount,
      limitPrice: orderLimitPrice,
      orderType,
      fixtureOutcome: effectiveFixtureOutcome
    });
    const preview = toBidOrderPreview(gamePreview);
    const matchOutcome = effectiveFixtureOutcome
      ? undefined
      : findGameMarketOutcome(gameSnapshot.outcomes, matchOutcomeSide);

    return {
      gameSnapshot,
      gamePreview,
      preview,
      yesPrice: matchProbability,
      noPrice: Math.max(0, 100 - matchProbability),
      yesTokenPrice: effectiveFixtureOutcome
        ? (getDefaultFixtureLimitPrice(
            effectiveFixtureOutcome,
            "yes",
            tradeSide
          ) ?? 0)
        : resolveGameOutcomeTradePrice(
            matchOutcome,
            matchProbability,
            "yes",
            tradeSide
          ),
      noTokenPrice: effectiveFixtureOutcome
        ? (getDefaultFixtureLimitPrice(
            effectiveFixtureOutcome,
            "no",
            tradeSide
          ) ?? 0)
        : resolveGameOutcomeTradePrice(
            matchOutcome,
            matchProbability,
            "no",
            tradeSide
          ),
      defaultLimit,
      orderLimitPrice
    };
  }, [
    cappedOrderAmount,
    effectiveFixtureOutcome,
    input,
    matchOutcomeSide,
    maxSellShares,
    orderMode,
    orderType,
    outcomeSide,
    limitPrice,
    tradeSide
  ]);

  const preview = teamDefaults?.preview ?? gameDefaults?.preview;
  useEffect(() => {
    previewForReadinessRef.current = preview;
  }, [preview]);
  const previewCanSubmit = preview?.canSubmitRealOrder ?? false;
  const takeProfitLimitAvailable = isTakeProfitLimitAvailable(
    preview?.shareSize ?? 0
  );

  useEffect(() => {
    if (!takeProfitLimitAvailable && takeProfitLimitEnabled) {
      setTakeProfitLimitEnabled(false);
    }
  }, [
    takeProfitLimitAvailable,
    takeProfitLimitEnabled,
    setTakeProfitLimitEnabled
  ]);

  const expirationError =
    orderMode === "limit" && limitExpiration === "custom"
      ? validateLimitExpirationCustom(t, limitExpirationCustom)
      : undefined;

  const actionInProgress =
    status === "loading" || status === "signing" || status === "submitting";

  const submitLabel = resolveTradeActionLabel(
    t,
    tradeSide,
    outcomeSide,
    input.variant
  );

  const primaryAction = useMemo(() => {
    return resolveTradePrimaryAction({
      isAuthenticated,
      session,
      orderReadiness: readiness,
      authReadiness,
      tradeSide,
      submitLabel,
      previewCanSubmit,
      previewDisabledReason: preview?.disabledReason,
      expirationError,
      isBuyRestricted,
      isRegionFullyBlocked: isRegionBlocked,
      isRegionCloseOnly,
      eligibilityNetworkError: isEligibilityNetworkFailure(session)
    });
  }, [
    authReadiness,
    expirationError,
    isAuthenticated,
    isBuyRestricted,
    isRegionBlocked,
    isRegionCloseOnly,
    preview?.disabledReason,
    previewCanSubmit,
    readiness,
    session,
    submitLabel,
    tradeSide
  ]);

  const canSubmit = canSubmitTradeTicket({
    status,
    previewCanSubmit: previewCanSubmit && !expirationError
  });

  const actionLabel = resolveTradePrimaryActionLabel(
    t,
    primaryAction.kind,
    submitLabel
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

  const readinessQueryKey = useMemo(() => {
    if (!preview?.tokenId) {
      return null;
    }

    return buildPreviewBalancesQueryKey(preview, tradeSide);
  }, [
    preview?.estimatedCost,
    preview?.estimatedTakerFee,
    preview?.estimatedTotalCost,
    preview?.shareSize,
    preview?.tokenId,
    tradeSide
  ]);

  const applyReadinessFetch = useCallback(
    async (
      orderPreview: NonNullable<typeof preview>,
      options?: { force?: boolean }
    ) => {
      const queryKey = buildPreviewBalancesQueryKey(orderPreview, tradeSide);

      if (!queryKey) {
        return undefined;
      }

      if (
        !options?.force &&
        queryKey === lastFetchedReadinessKeyRef.current
      ) {
        return undefined;
      }

      const generation = ++readinessFetchGeneration.current;

      try {
        const nextReadiness = await fetchReadinessForPreview(
          orderPreview,
          tradeSide,
          authReadinessRef.current,
          options
        );

        if (generation === readinessFetchGeneration.current) {
          setReadiness(nextReadiness);
          setEligibilityRetryAvailable(
            isEligibilityNetworkFailure(sessionRef.current)
          );
          lastFetchedReadinessKeyRef.current = queryKey;

          trackEligibilityCheckCompleted({
            ...resolveTradeAnalyticsContext(input, orderPreview, tradeSide),
            eligibilityStatus: nextReadiness.ready ? "eligible" : "not_ready"
          });
        }

        return nextReadiness;
      } catch (error) {
        if (generation === readinessFetchGeneration.current) {
          setMessage(error instanceof Error ? error.message : String(error));
        }

        throw error;
      }
    },
    [tradeSide]
  );

  useEffect(() => {
    if (!readinessQueryKey) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      if (readinessQueryKey === lastFetchedReadinessKeyRef.current) {
        return;
      }

      const orderPreview = previewForReadinessRef.current;

      if (!orderPreview) {
        return;
      }

      const analyticsContext = resolveTradeAnalyticsContext(
        input,
        orderPreview,
        tradeSide
      );

      trackOrderPreviewRequested(analyticsContext);

      if (orderPreview.canSubmitRealOrder) {
        trackOrderPreviewCompleted(analyticsContext);
      }

      void applyReadinessFetch(orderPreview);
    }, READINESS_FETCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [applyReadinessFetch, input, readinessQueryKey, tradeSide]);

  useEffect(() => {
    if (orderAmount === 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      trackOrderInputChanged({
        ...resolveTradeAnalyticsContext(input, preview, tradeSide),
        changedField: "amount",
        amount: orderAmount
      });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [amount, input, orderAmount, preview, tradeSide]);

  const refreshOutcomeShares = useCallback(async () => {
    if (!isAuthenticated || !conditionId) {
      setOutcomeShares((current) =>
        current.yes === 0 && current.no === 0 ? current : { yes: 0, no: 0 }
      );
      return;
    }

    try {
      const positions = await fetchMarketOutcomeShares(conditionId);
      const nextShares = buildOutcomeShareMap(positions, yesTokenId, noTokenId);

      setOutcomeShares((current) =>
        current.yes === nextShares.yes && current.no === nextShares.no
          ? current
          : nextShares
      );
    } catch {
      setOutcomeShares((current) =>
        current.yes === 0 && current.no === 0 ? current : { yes: 0, no: 0 }
      );
    }
  }, [conditionId, isAuthenticated, noTokenId, yesTokenId]);

  useEffect(() => {
    if (!sellPosition) {
      setPositionAcceptingOrders(undefined);
      return;
    }

    let cancelled = false;

    void fetchMarketAcceptingOrders({
      slug: sellPosition.slug,
      conditionId: sellPosition.conditionId
    }).then((acceptingOrders) => {
      if (!cancelled) {
        setPositionAcceptingOrders(acceptingOrders);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [sellPosition?.asset, sellPosition?.conditionId, sellPosition?.slug]);

  useEffect(() => {
    if (maxSellShares === undefined || maxSellShares <= 0) {
      return;
    }

    if (parseOrderAmount(amount) > maxSellShares) {
      setAmount(String(maxSellShares));
    }
  }, [amount, maxSellShares, setAmount]);

  useEffect(() => {
    if (sellPosition && tradeSide === "sell") {
      if (input.variant === "team") {
        const side = resolveOutcomeSideForPosition(
          sellPosition,
          input.snapshot
        );
        const nextShares = {
          yes: side === "yes" ? sellPosition.size : 0,
          no: side === "no" ? sellPosition.size : 0
        };

        setOutcomeShares((current) =>
          current.yes === nextShares.yes && current.no === nextShares.no
            ? current
            : nextShares
        );
        return;
      }

      const nextShares = {
        yes: outcomeSide === "yes" ? sellPosition.size : 0,
        no: outcomeSide === "no" ? sellPosition.size : 0
      };

      setOutcomeShares((current) =>
        current.yes === nextShares.yes && current.no === nextShares.no
          ? current
          : nextShares
      );
      return;
    }

    if (!isAuthenticated) {
      setOutcomeShares((current) =>
        current.yes === 0 && current.no === 0 ? current : { yes: 0, no: 0 }
      );
      return;
    }

    if (tradeSide === "sell") {
      void refreshOutcomeShares();
    }
  }, [
    input,
    isAuthenticated,
    outcomeSide,
    refreshOutcomeShares,
    sellPosition,
    tradeSide
  ]);

  const refreshOrderReadiness = useCallback(async () => {
    const orderPreview = previewForReadinessRef.current;

    if (!orderPreview) {
      return undefined;
    }

    return applyReadinessFetch(orderPreview, { force: true });
  }, [applyReadinessFetch]);

  const handleRetryEligibility = useCallback(async () => {
    setStatus("loading");
    setMessage(t("checkingEligibility"));

    try {
      await refreshTradingEligibility();
      const nextReadiness = await refreshOrderReadiness();
      const stillBlocked = isEligibilityNetworkFailure(session);

      setEligibilityRetryAvailable(stillBlocked);
      setStatus(stillBlocked ? "error" : "idle");
      const blockedMessage = stillBlocked
        ? session?.eligibilityReason
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
  }, [refreshOrderReadiness, session, t]);

  const submitOrder = useCallback(async () => {
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
      tradeSide,
      isBuyRestricted,
      isRegionFullyBlocked: isRegionBlocked,
      openLogin,
      signClobCredentials,
      signTokenApprovals,
      refreshSetupReadiness
    });

    if (!gate.ok) {
      if (gate.action === "show_error" || gate.action === "retry_eligibility") {
        setStatus("error");
        const translatedGateMessage = translateTradeMessage(gate.message, t);
        setMessage(translatedGateMessage);
        setEligibilityRetryAvailable(gate.action === "retry_eligibility");
        showOrderErrorToast(translatedGateMessage);
      } else {
        setStatus("idle");
        setMessage(translateTradeMessage(gate.message, t));
        setEligibilityRetryAvailable(false);
        await refreshOrderReadiness();
      }

      return;
    }

    setEligibilityRetryAvailable(false);
    setReadiness(gate.readiness);

    if (!session?.funderAddress || !preview.tokenId) {
      const missingSessionMessage = t("walletSessionRequired");
      setStatus("error");
      setMessage(missingSessionMessage);
      showOrderErrorToast(missingSessionMessage);
      return;
    }

    trackOrderSubmitStarted(
      resolveTradeAnalyticsContext(input, preview, tradeSide)
    );

    setStatus("signing");
    setMessage(t("reviewSignOrder"));

    try {
      let userOrderPreview;

      if (input.variant === "team") {
        userOrderPreview = buildTeamUserOrderPreview(input.snapshot, preview);
      } else if (!gameDefaults) {
        throw new Error(t("gameMarketPreviewUnavailable"));
      } else {
        userOrderPreview = buildGameUserOrderPreview(
          input.gameSnapshot,
          gameDefaults.gamePreview,
          selectedFixtureOutcome
        );
      }

      setStatus("submitting");
      setMessage(t("submittingOrder"));

      const result = await submitSignedTradeOrder({
        session,
        preview,
        orderType,
        userOrderPreview,
        expiration: limitExpirationTimestamp
      });

      void reportTradeOrderTransaction(
        input.variant === "team"
          ? {
              userOrderPreview,
              result,
              preview,
              variant: "team",
              snapshot: input.snapshot
            }
          : {
              userOrderPreview,
              result,
              preview,
              variant: "game",
              gameSnapshot: input.gameSnapshot,
              fixtureOutcome:
                effectiveFixtureOutcome ?? selectedFixtureOutcome
            }
      );

      await postCollateralBalanceSync(preview.tokenId).catch(() => undefined);
      await refreshOutcomeShares();

      let takeProfitLimitPlaced = false;

      if (
        orderMode === "market" &&
        tradeSide === "buy" &&
        takeProfitLimitEnabled &&
        takeProfitLimitPrice.trim() &&
        takeProfitLimitAvailable &&
        preview.shareSize >= LIMIT_BUY_MIN_SHARES &&
        preview.tokenId
      ) {
        try {
          const takeProfitPrice = resolveTakeProfitLimitPrice(
            takeProfitLimitPrice,
            preview.sidePrice
          );
          const conditionalBalance = await fetchConditionalTokenBalance(
            preview.tokenId
          ).catch(() => undefined);
          const cappedShareSize = resolveMaxSellShares(
            preview.shareSize,
            conditionalBalance
          );

          if (cappedShareSize === undefined || cappedShareSize <= 0) {
            throw new Error(t("takeProfitBalanceUnavailable"));
          }

          const takeProfitBundle =
            input.variant === "team"
              ? buildTakeProfitOrderBundle({
                  variant: "team",
                  snapshot: input.snapshot,
                  outcomeSide: preview.outcomeSide,
                  shareSize: cappedShareSize,
                  limitPrice: takeProfitPrice,
                  tokenId: preview.tokenId,
                  maxShareSize: cappedShareSize,
                  acceptingOrders: preview.acceptingOrders
                })
              : buildTakeProfitOrderBundle({
                  variant: "game",
                  gameSnapshot: input.gameSnapshot,
                  matchOutcomeSide,
                  outcomeSide: preview.outcomeSide,
                  shareSize: cappedShareSize,
                  limitPrice: takeProfitPrice,
                  tokenId: preview.tokenId,
                  fixtureOutcome:
                    effectiveFixtureOutcome ?? selectedFixtureOutcome,
                  maxShareSize: cappedShareSize
                });

          if (!takeProfitBundle.bidPreview.canSubmitRealOrder) {
            throw new Error(
              takeProfitBundle.bidPreview.disabledReason ??
                t("takeProfitLimitUnavailable")
            );
          }

          setStatus("signing");
          setMessage(t("reviewSignTakeProfit"));

          setStatus("submitting");
          setMessage(t("submittingTakeProfit"));

          await submitTakeProfitLimitOrder({
            session,
            preview: takeProfitBundle.bidPreview,
            userOrderPreview: takeProfitBundle.userPreview
          });
          takeProfitLimitPlaced = true;
        } catch (takeProfitError) {
          const detail = resolveOrderErrorMessage(takeProfitError);
          showOrderErrorToast(`${t("takeProfitLimitFailed")} ${detail}`);
        }
      }

      showOrderSubmittedToast(
        formatOrderToastSummary({
          tradeSide: preview.tradeSide,
          outcomeSide: preview.outcomeSide,
          estimatedTotalCost: preview.estimatedTotalCost,
          shareSize: preview.shareSize,
          variant: input.variant
        }) +
          (takeProfitLimitPlaced ? t("takeProfitLimitSubmittedSuffix") : ""),
        {
          orderId: result.order?.id,
          onViewPortfolio: () => router.push("/portfolio")
        }
      );
     if (TRADE_BID_BUTTON_ID) {
       void fireBasicConfettiFromElement(
         document.getElementById(TRADE_BID_BUTTON_ID)
       );
     }
      trackOrderSubmitSucceeded({
        ...resolveTradeAnalyticsContext(input, preview, tradeSide),
        orderStatus: "succeeded"
      });

      setStatus("idle");
      setMessage(undefined);
      setTakeProfitLimitEnabled(false);
      setTakeProfitLimitPrice("");

      await Promise.all([
        refreshOrderReadiness(),
        refreshSetupReadiness(),
        refreshOutcomeShares()
      ]);
      await input.onOrderSuccess?.();
    } catch (error) {
      const errorMessage = resolveOrderErrorMessage(error);
      trackOrderSubmitFailed({
        ...resolveTradeAnalyticsContext(input, preview, tradeSide),
        orderStatus: "failed",
        failureReason: "wallet_rejected",
        errorCode: "ORDER_SUBMIT_FAILED"
      });
      setStatus("error");
      setMessage(errorMessage);
      showOrderErrorToast(error);
    }
  }, [
    actionInProgress,
    authReadiness,
    expirationError,
    gameDefaults?.orderLimitPrice,
    input,
    limitExpiration,
    limitExpirationCustom,
    matchOutcomeSide,
    openLogin,
    orderAmount,
    orderMode,
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
    refreshOutcomeShares,
    setTakeProfitLimitEnabled,
    setTakeProfitLimitPrice,
    takeProfitLimitEnabled,
    takeProfitLimitPrice,
    effectiveFixtureOutcome,
    selectedFixtureOutcome,
    matchOutcomeSide,
    tradeSide,
    t
  ]);

  const handleTradeAction = useCallback(async () => {
    if (!preview || actionInProgress) {
      return;
    }

    if (expirationError) {
      setStatus("error");
      setMessage(expirationError);
      showOrderErrorToast(expirationError);
      return;
    }

    if (primaryAction.kind !== "submit") {
      setMessage(undefined);
      setEligibilityRetryAvailable(false);

      try {
        if (primaryAction.kind === "sync_allowance") {
          setStatus("loading");
        }

        await runTradePrimaryAction(primaryAction, {
          tokenId: preview.tokenId,
          openLogin,
          signClobCredentials,
          signTokenApprovals,
          refreshOrderReadiness,
          refreshSetupReadiness,
          onRetryEligibility: handleRetryEligibility
        });

        if (primaryAction.kind === "sync_allowance") {
          setStatus("idle");
          setMessage(t("allowanceRefreshed"));
        } else if (primaryAction.kind === "deposit") {
          setStatus("idle");
          setMessage(
            primaryAction.hint
              ? translateTradeMessage(primaryAction.hint, t)
              : undefined
          );
        } else if (
          primaryAction.kind === "market_blocked" ||
          primaryAction.kind === "eligibility_blocked"
        ) {
          setStatus("error");
          const translatedHint = primaryAction.hint
            ? translateTradeMessage(primaryAction.hint, t)
            : undefined;
          setMessage(translatedHint);
          if (translatedHint) {
            showOrderErrorToast(translatedHint);
          }
        } else if (primaryAction.kind === "retry_eligibility") {
          return;
        } else {
          setStatus("idle");
          setMessage(
            primaryAction.hint
              ? translateTradeMessage(primaryAction.hint, t)
              : undefined
          );
        }
      } catch (error) {
        setStatus("error");
        setMessage(resolveOrderErrorMessage(error));
        showOrderErrorToast(error);
      }

      return;
    }

    trackOrderConfirmClicked(
      resolveTradeAnalyticsContext(input, preview, tradeSide)
    );
    await submitOrder();
  }, [
    actionInProgress,
    expirationError,
    handleRetryEligibility,
    openLogin,
    preview,
    primaryAction,
    refreshOrderReadiness,
    refreshSetupReadiness,
    signClobCredentials,
    signTokenApprovals,
    submitOrder,
    t
  ]);

  function applyQuickAmount(value: number | "all") {
    if (
      orderMode === "limit" &&
      tradeSide === "buy" &&
      typeof value === "number"
    ) {
      setAmount(resolveLimitShareQuickAmount(amount, value));
      setMessage(undefined);
      setEligibilityRetryAvailable(false);
      return;
    }

    if (tradeSide === "sell") {
      if (value === "all") {
        const nextAmount = resolveSellQuickAmount(availableShares, "max");

        if (nextAmount) {
          setAmount(nextAmount);
        }

        return;
      }

      if (value > 0 && value < 1) {
        const nextAmount = resolveSellQuickAmount(
          availableShares,
          value as SellQuickAmountFraction
        );

        if (nextAmount) {
          setAmount(nextAmount);
        }

        setMessage(undefined);
        setEligibilityRetryAvailable(false);
        return;
      }
    }

    if (value === "all") {
      if (tradeSide === "buy" && orderMode === "market" && preview) {
        const availableCash = resolveTradeTicketAvailableCash(readiness);

        if (availableCash !== undefined && availableCash > 0) {
          const fee =
            input.variant === "team"
              ? input.snapshot.market.polymarket?.fee
              : (effectiveFixtureOutcome?.fee ??
                findGameMarketOutcome(
                  input.gameSnapshot.outcomes,
                  matchOutcomeSide
                )?.fee);

          const nextAmount = resolveMarketBuyAllInAmount({
            availableCash,
            sidePrice: preview.sidePrice,
            fee
          });

          // console.log("availableCash", availableCash, nextAmount);

          if (nextAmount > 0) {
            setAmount(formatMarketBuyAmountInput(nextAmount));
            setMessage(undefined);
            setEligibilityRetryAvailable(false);
          }
        }

        return;
      }

      const balance = resolveQuickAmountAllBalance(
        readiness,
        tradeSide,
        availableShares
      );

      if (balance !== undefined && balance > 0) {
        setAmount(String(balance));
      }

      return;
    }

    setAmount(resolveLimitShareQuickAmount(amount, value));
    setMessage(undefined);
    setEligibilityRetryAvailable(false);
  }

  function selectOutcome(side: typeof outcomeSide) {
    if (side === outcomeSide) {
      return;
    }

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

  const kickoffAt =
    input.variant === "game" ? input.gameSnapshot.match.kickoffAt : undefined;
  const availableCash = resolveTradeTicketAvailableCash(readiness);
  const fundingMessage =
    !expirationError &&
    !message &&
    primaryAction.kind !== "submit" &&
    primaryAction.hint
      ? translateTradeMessage(primaryAction.hint, t)
      : undefined;

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
      yesShares: outcomeShares.yes,
      noShares: outcomeShares.no,
      availableShares,
      availableCash,
      kickoffAt,
      limitExpiration,
      limitExpirationCustom,
      expirationError,
      fundingMessage,
      actionLabel,
      canSubmit,
      actionInProgress,
      isAuthenticated,
      status,
      message,
      eligibilityRetryAvailable:
        eligibilityRetryAvailable || primaryAction.kind === "retry_eligibility",
      onSelectOutcome: selectOutcome,
      onAmountChange: setAmount,
      onLimitPriceChange: setLimitPrice,
      onLimitExpirationChange: setLimitExpiration,
      onLimitExpirationCustomChange: setLimitExpirationCustom,
      onQuickAmount: applyQuickAmount,
      onSubmit: handleTradeAction,
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
      },
      takeProfitLimitEnabled,
      takeProfitLimitDisabled: !takeProfitLimitAvailable,
      takeProfitLimitPrice,
      onTakeProfitLimitEnabledChange: (value: boolean) => {
        setTakeProfitLimitEnabled(value);

        if (!value) {
          setTakeProfitLimitPrice("");
        }
      },
      onTakeProfitLimitPriceChange: setTakeProfitLimitPrice
    }
  };
}
