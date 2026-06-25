"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { OutcomeDisplaySwitcher } from "@/components/ui/outcome-display-switcher";
import { TabSwitcher } from "@/components/ui/tab-switcher";
import type { OutcomeDisplayMode } from "@/lib/market/outcome-display-mode";
import { useAuth } from "@/context/auth";
import { useComboLivePrices } from "@/hooks/combo/use-combo-live-prices";
import { useComboMarkets } from "@/hooks/combo/use-combo-markets";
import { useComboTicket } from "@/hooks/combo/use-combo-ticket";
import { filterComboGroupsForDay } from "@/lib/combo/combo-game-live-state";
import { useComboGroupsWithLiveState } from "@/hooks/combo/use-combo-groups-with-live-state";
import { applyComboGameGroupPickUpdate } from "@/lib/combo/combo-group-picks";
import { buildComboLegsFromPicks } from "@/lib/combo/markets-client";
import { isExactScoreMarket } from "@/lib/combo/combo-market-mutex";
import { applyComboLegSelectionRules } from "@/lib/combo/combo-leg-selection";
import {
  buildComboSelectedOddsIdForPick,
  mapComboGameToItemProps,
  parseComboMarketOddsId,
  parseComboMarketSlug,
  resolveComboMarketTeamCodes,
  resolveSpreadMarketForTeamLine,
} from "@/lib/combo/map-market-to-combo-item";
import {
  findComboGameGroupForMarket,
  resolveComboPickStoredOutcomeSide,
  resolveHalftimeTeamMarket,
  resolveMatchMoneylineMarket,
} from "@/lib/combo/combo-pick-outcome";
import { isMatchTotalMarket } from "@/lib/combo/match-total-combo-rules";
import { resolveTradeTicketAvailableCash } from "@/lib/trading/cash-balance-model";
import {
  useComboBidAmount,
  useComboPicks,
  useRemoveComboPick,
  useSetComboBidAmount,
  useSetComboPicks,
} from "@/store/combo-store";
import { useSetOutcomeDisplayMode } from "@/store/user-config-store";
import type { ComboGameGroup, ComboMarketRecord, ComboMarketsDay } from "@/types/combo";
import { ComboItem } from "@/views/combo/combo-item";
import { ComboOutcomeDisplayProvider } from "@/views/combo/combo-outcome-display-context";
import type { ComboOddsOption } from "@/views/combo/combo-item/types";
import {
  ComboMobileWidget,
  COMBO_MOBILE_PAGE_SCROLL_BUFFER_PX,
  COMBO_MOBILE_WIDGET_BOTTOM_OFFSET_PX,
  getComboMobileReserveHeight
} from "@/views/combo/combo-mobile-widget";
import { ComboWidget } from "@/views/combo/combo-widget";
import type { ComboWidgetProps } from "@/views/combo/combo-widget/types";
import type { ComboPickOutcomeSide } from "@/views/combo/combo-widget/types";
import { createComboPickFromMarket } from "@/views/combo/combo-ticket-container";
import { SyncComboLiveStore } from "@/views/combo/sync-combo-live-store";
import { MIN_COMBO_PICKS } from "@/views/combo/combo-widget/constants";

const COMBO_DAY_TABS: ComboMarketsDay[] = ["today", "tomorrow", "all"];

export function ComboPageView() {
  const t = useTranslations("combo");
  const tWallet = useTranslations("wallet");
  const auth = useAuth();
  const setOutcomeDisplayMode = useSetOutcomeDisplayMode();
  const [outcomeDisplayMode, setOutcomeDisplayModeLocal] =
    useState<OutcomeDisplayMode>("decimal");
  const { day, setDay, groups, markets, loading, error, reload } =
    useComboMarkets();
  const hasUserSelectedDayRef = useRef(false);
  const hasAttemptedInitialTodayFallbackRef = useRef(false);

  const groupsWithLive = useComboGroupsWithLiveState(groups);
  const visibleGroups = useMemo(
    () => filterComboGroupsForDay(groupsWithLive, day),
    [groupsWithLive, day],
  );

  const handleDayChange = useCallback(
    (value: ComboMarketsDay) => {
      hasUserSelectedDayRef.current = true;
      setDay(value);
    },
    [setDay],
  );

  useEffect(() => {
    if (hasUserSelectedDayRef.current) {
      return;
    }

    if (hasAttemptedInitialTodayFallbackRef.current) {
      return;
    }

    if (day !== "today" || loading || error) {
      return;
    }

    hasAttemptedInitialTodayFallbackRef.current = true;

    if (visibleGroups.length === 0) {
      setDay("tomorrow");
    }
  }, [day, error, loading, setDay, visibleGroups.length]);
  const { liveYesPriceByMarketId } = useComboLivePrices({
    markets,
    enabled: markets.length > 0
  });
  const picks = useComboPicks();
  const bidAmount = useComboBidAmount();
  const removePick = useRemoveComboPick();
  const setBidAmount = useSetComboBidAmount();
  const setPicks = useSetComboPicks();

  const dayTabItems = useMemo(
    () =>
      COMBO_DAY_TABS.map((tabDay) => ({
        id: tabDay,
        label:
          tabDay === "all"
            ? t("all")
            : tabDay === "today"
              ? t("today")
              : t("tomorrow")
      })),
    [t]
  );

  const legs = useMemo(
    () => buildComboLegsFromPicks(picks, markets),
    [markets, picks]
  );

  const ticket = useComboTicket({
    legs,
    bidAmount,
    enabled: legs.length >= MIN_COMBO_PICKS && bidAmount > 0,
    onSubmitSuccess: () => {
      setPicks([]);
      setBidAmount(0);
    }
  });

  const balance = useMemo(
    () => resolveTradeTicketAvailableCash(auth.readiness) ?? 0,
    [auth.readiness]
  );

  const marketsById = useMemo(
    () => new Map(markets.map((market) => [market.id, market])),
    [markets]
  );

  const picksByMarketId = useMemo(() => {
    const map = new Map<string, (typeof picks)[number]>();

    for (const pick of picks) {
      map.set(pick.id, pick);
    }

    return map;
  }, [picks]);

  const handleSelectMarketOdds = useCallback(
    (
      group: ComboGameGroup,
      market: ComboMarketRecord,
      option: ComboOddsOption,
    ) => {
      if (option.disabled) {
        return;
      }

      const parsed = parseComboMarketOddsId(option.id);

      if (!parsed || parsed.marketId !== market.id) {
        return;
      }

      const teamMeta = resolveComboMarketTeamCodes(market);
      const storedOutcomeSide = resolveComboPickStoredOutcomeSide(
        market,
        parsed.outcomeSide,
      );
      const pick = createComboPickFromMarket({
        market,
        group,
        outcomeSide: parsed.outcomeSide,
        teamCode: teamMeta.teamCode,
        teamName: teamMeta.teamName
      });

      setPicks(
        applyComboGameGroupPickUpdate(
          picks,
          group,
          market.id,
          storedOutcomeSide,
          () => pick,
        ),
      );
    },
    [picks, setPicks]
  );

  const handlePickOutcomeChange = useCallback(
    (pickId: string, side: ComboPickOutcomeSide) => {
      const market = marketsById.get(pickId);

      if (!market || !picksByMarketId.has(pickId)) {
        return;
      }

      const group = findComboGameGroupForMarket(groups, pickId);

      if (!group) {
        return;
      }

      const marketKind = parseComboMarketSlug(market.slug).marketKind;

      if (marketKind === "moneyline") {
        const targetMarket = resolveMatchMoneylineMarket(
          group,
          side === "yes" ? "home" : "away",
        );

        if (!targetMarket) {
          return;
        }

        const teamMeta = resolveComboMarketTeamCodes(targetMarket);
        const pick = createComboPickFromMarket({
          market: targetMarket,
          group,
          outcomeSide: side,
          teamCode: teamMeta.teamCode,
          teamName: teamMeta.teamName,
        });

        setPicks(
          applyComboGameGroupPickUpdate(
            picks,
            group,
            targetMarket.id,
            side,
            () => pick,
          ),
        );
        return;
      }

      if (marketKind === "halftime") {
        const targetMarket = resolveHalftimeTeamMarket(
          group,
          side === "yes" ? "home" : "away",
        );

        if (!targetMarket) {
          return;
        }

        const teamMeta = resolveComboMarketTeamCodes(targetMarket);
        const pick = createComboPickFromMarket({
          market: targetMarket,
          group,
          outcomeSide: side,
          teamCode: teamMeta.teamCode,
          teamName: teamMeta.teamName,
        });

        setPicks(
          applyComboGameGroupPickUpdate(
            picks,
            group,
            targetMarket.id,
            side,
            () => pick,
          ),
        );
        return;
      }

      if (isMatchTotalMarket(market)) {
        const teamMeta = resolveComboMarketTeamCodes(market);
        const pick = createComboPickFromMarket({
          market,
          group,
          outcomeSide: side,
          teamCode: teamMeta.teamCode,
          teamName: teamMeta.teamName,
        });

        setPicks(
          applyComboGameGroupPickUpdate(
            picks,
            group,
            market.id,
            side,
            () => pick,
          ),
        );
        return;
      }

      if (isExactScoreMarket(market)) {
        const teamMeta = resolveComboMarketTeamCodes(market);
        const pick = createComboPickFromMarket({
          market,
          group,
          outcomeSide: side,
          teamCode: teamMeta.teamCode,
          teamName: teamMeta.teamName,
        });

        setPicks(
          applyComboGameGroupPickUpdate(
            picks,
            group,
            market.id,
            side,
            () => pick,
          ),
        );
        return;
      }

      const teamMeta = resolveComboMarketTeamCodes(market);
      const nextPick = createComboPickFromMarket({
        market,
        group,
        outcomeSide: side,
        teamCode: teamMeta.teamCode,
        teamName: teamMeta.teamName,
      });

      setPicks(
        picks.map((pick) => (pick.id === pickId ? nextPick : pick)),
      );
    },
    [groups, marketsById, picks, picksByMarketId, setPicks],
  );

  const handlePickSpreadChange = useCallback(
    (pickId: string, spread: string) => {
      const pick = picksByMarketId.get(pickId);

      if (!pick || pick.type !== "spread" || pick.spreadValue === spread) {
        return;
      }

      const group = findComboGameGroupForMarket(groups, pickId);

      if (!group) {
        return;
      }

      const targetMarket = resolveSpreadMarketForTeamLine(
        group,
        pick.team.code,
        spread,
      );

      if (!targetMarket) {
        return;
      }

      const nextPick = createComboPickFromMarket({
        market: targetMarket,
        group,
      });

      setPicks(
        picks.map((entry) => (entry.id === pickId ? nextPick : entry)),
      );
    },
    [groups, picks, picksByMarketId, setPicks],
  );

  const handleRemovePick = useCallback(
    (pickId: string) => {
      removePick(pickId);
    },
    [removePick]
  );

  const handleOutcomeDisplayChange = useCallback(
    (mode: OutcomeDisplayMode) => {
      setOutcomeDisplayModeLocal(mode);
      setOutcomeDisplayMode(mode);
    },
    [setOutcomeDisplayMode]
  );

  const comboWidgetProps: ComboWidgetProps = {
    picks,
    multiplier: ticket.multiplier,
    bidAmount,
    balance,
    toWinAmount: ticket.toWinAmount,
    isAuthenticated: ticket.isAuthenticated,
    loginInProgress: auth.loginInProgress,
    connectWalletLabel: t("connectWallet"),
    connectingLabel: t("connecting"),
    submitLabel: t("submitCombo"),
    isSubmitting: ticket.isSubmitting,
    isSubmitDisabled: ticket.isSubmitDisabled,
    isQuoteLoading: ticket.isAuthenticated && ticket.isQuotePending,
    onBidAmountChange: setBidAmount,
    onPickOutcomeChange: handlePickOutcomeChange,
    onPickSpreadChange: handlePickSpreadChange,
    onRemovePick: handleRemovePick,
    onConnectWallet: () => void auth.openLogin(),
    onSubmit: ticket.submit
  };

  const mobileBottomReservePx =
    getComboMobileReserveHeight(picks.length) +
    COMBO_MOBILE_WIDGET_BOTTOM_OFFSET_PX +
    COMBO_MOBILE_PAGE_SCROLL_BUFFER_PX;

  return (
    <section className="mx-auto w-full max-w-[1200px] px-3 pt-4 md:px-4 md:pt-5 lg:pb-8">
      <SyncComboLiveStore groups={groupsWithLive} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_345px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <TabSwitcher
              items={dayTabItems}
              value={day}
              onChange={(value) => handleDayChange(value as ComboMarketsDay)}
              size="compact"
              className="min-w-0 flex-1"
              aria-label={t("marketsTitle")}
            />
            <OutcomeDisplaySwitcher
              value={outcomeDisplayMode}
              onChange={handleOutcomeDisplayChange}
              aria-label={tWallet("outcomeDisplay")}
            />
          </div>

          {loading ? (
            <p className="text-sm text-[#909090]">{t("loadingMarkets")}</p>
          ) : null}

          {error ? (
            <div className="flex flex-col gap-2 rounded-lg border border-[#EBEBEB] bg-white p-4">
              <p className="text-sm text-[#909090]">{error}</p>
              <button
                type="button"
                onClick={() => void reload()}
                className="self-start text-sm font-[500] text-black underline"
              >
                {t("retry")}
              </button>
            </div>
          ) : null}

          {!loading && !error && visibleGroups.length === 0 ? (
            <p className="text-sm text-[#909090]">{t("emptyMarkets")}</p>
          ) : null}

          <ComboOutcomeDisplayProvider mode={outcomeDisplayMode}>
            {visibleGroups.map((group) => {
              const groupPicks = group.markets
                .map((market) => picksByMarketId.get(market.id))
                .filter((pick): pick is NonNullable<typeof pick> =>
                  Boolean(pick)
                );
              const selectedPick = groupPicks[0];
              const selectedOutcomeSide =
                selectedPick &&
                "outcomeSide" in selectedPick &&
                selectedPick.type === "moneyline"
                  ? selectedPick.outcomeSide
                  : undefined;
              const selectedOddsIds = groupPicks
                .map((pick) =>
                  buildComboSelectedOddsIdForPick(
                    pick,
                    marketsById.get(pick.id),
                    group,
                  ),
                )
                .filter((id): id is string => Boolean(id));
              const selectedLegsCount = group.markets.reduce(
                (count, market) =>
                  count + (picksByMarketId.has(market.id) ? 1 : 0),
                0
              );
              const baseItemProps = mapComboGameToItemProps(group, {
                selectedMarketId: selectedPick?.id,
                selectedOutcomeSide,
                isInCombo: Boolean(selectedPick),
                liveYesPriceByMarketId
              });
              const selectionRules = applyComboLegSelectionRules({
                moneylineOdds: baseItemProps.moneylineOdds,
                halftimeOdds: baseItemProps.halftimeOdds ?? [],
                spreadOdds: baseItemProps.spreadOdds,
                topScoreOdds: baseItemProps.topScoreOdds,
                totalOdds: baseItemProps.totalOdds ?? [],
                groupPicks,
                group,
                disabledTooltip: t("cannotAddToCombo")
              });

              return (
                <ComboItem
                  key={group.slug}
                  {...baseItemProps}
                  selectedLegsCount={selectedLegsCount}
                  selectedOddsIds={selectedOddsIds}
                  bttsOdds={[]}
                  moneylineOdds={selectionRules.moneylineOdds}
                  halftimeOdds={selectionRules.halftimeOdds}
                  spreadOdds={selectionRules.spreadOdds}
                  topScoreOdds={selectionRules.topScoreOdds}
                  totalOdds={selectionRules.totalOdds}
                  onSelectOdds={(option) => {
                    const parsed = parseComboMarketOddsId(option.id);
                    const market = parsed
                      ? marketsById.get(parsed.marketId)
                      : undefined;

                    if (market) {
                      handleSelectMarketOdds(group, market, option);
                    }
                  }}
                />
              );
            })}
          </ComboOutcomeDisplayProvider>
        </div>

        <aside className="hidden lg:block lg:w-[345px] lg:shrink-0">
          <div className="lg:fixed lg:top-[88px] lg:z-20 lg:w-[345px] lg:max-h-[calc(100dvh-94px)] lg:overflow-y-auto lg:[right:max(1rem,calc((100vw-75rem)/2+1rem))]">
            <ComboWidget {...comboWidgetProps} />
          </div>
        </aside>
      </div>

      <ComboMobileWidget
        picks={picks}
        multiplier={ticket.multiplier}
        bidAmount={bidAmount}
        balance={balance}
        toWinAmount={ticket.toWinAmount}
        isAuthenticated={ticket.isAuthenticated}
        loginInProgress={auth.loginInProgress}
        connectWalletLabel={t("connectWallet")}
        connectingLabel={t("connecting")}
        submitLabel={t("submitCombo")}
        isSubmitting={ticket.isSubmitting}
        isSubmitDisabled={ticket.isSubmitDisabled}
        isQuoteLoading={ticket.isAuthenticated && ticket.isQuotePending}
        onBidAmountChange={setBidAmount}
        onRemovePick={handleRemovePick}
        onConnectWallet={() => void auth.openLogin()}
        onSubmit={ticket.submit}
      />

      <div
        className="shrink-0 lg:hidden"
        aria-hidden
        style={{
          height: `calc(${mobileBottomReservePx}px + env(safe-area-inset-bottom, 0px))`
        }}
      />
    </section>
  );
}
