"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";

import { TabSwitcher } from "@/components/ui/tab-switcher";
import { useAuth } from "@/context/auth";
import { useComboLivePrices } from "@/hooks/combo/use-combo-live-prices";
import { useComboMarkets } from "@/hooks/combo/use-combo-markets";
import { useComboTicket } from "@/hooks/combo/use-combo-ticket";
import { buildComboLegsFromPicks } from "@/lib/combo/markets-client";
import { applyComboLegSelectionRules } from "@/lib/combo/combo-leg-selection";
import {
  mapComboGameToItemProps,
  parseComboMarketOddsId,
  resolveComboMarketTeamCodes
} from "@/lib/combo/map-market-to-combo-item";
import { resolveTradeTicketAvailableCash } from "@/lib/trading/cash-balance-model";
import {
  useComboBidAmount,
  useComboPicks,
  useRemoveComboPick,
  useSetComboBidAmount,
  useSetComboPicks,
  useUpdateComboPick,
} from "@/store/combo-store";
import type { ComboGameGroup, ComboMarketRecord, ComboMarketsDay } from "@/types/combo";
import { ComboItem } from "@/views/combo/combo-item";
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
import { MIN_COMBO_PICKS } from "@/views/combo/combo-widget/constants";

const COMBO_DAY_TABS: ComboMarketsDay[] = ["today", "tomorrow", "all"];

export function ComboPageView() {
  const t = useTranslations("combo");
  const auth = useAuth();
  const { day, setDay, groups, markets, loading, error, reload } =
    useComboMarkets();
  const { liveYesPriceByMarketId } = useComboLivePrices({
    markets,
    enabled: markets.length > 0
  });
  const picks = useComboPicks();
  const bidAmount = useComboBidAmount();
  const updatePick = useUpdateComboPick();
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
    (group: ComboGameGroup, market: ComboMarketRecord, option: ComboOddsOption) => {
      if (option.disabled) {
        return;
      }

      const parsed = parseComboMarketOddsId(option.id);

      if (!parsed || parsed.marketId !== market.id) {
        return;
      }

      const existingPick = picksByMarketId.get(market.id);

      if (
        existingPick?.type === "moneyline" &&
        existingPick.outcomeSide === parsed.outcomeSide
      ) {
        removePick(market.id);
        return;
      }

      const groupMarketIds = new Set(group.markets.map((entry) => entry.id));
      const remainingPicks = picks.filter((pick) => !groupMarketIds.has(pick.id));
      const teamMeta = resolveComboMarketTeamCodes(market);
      const pick = createComboPickFromMarket({
        market,
        outcomeSide: parsed.outcomeSide,
        teamCode: teamMeta.teamCode,
        teamName: teamMeta.teamName
      });

      setPicks([...remainingPicks, pick]);
    },
    [picks, picksByMarketId, removePick, setPicks]
  );

  const handlePickOutcomeChange = useCallback(
    (pickId: string, side: ComboPickOutcomeSide) => {
      const pick = picksByMarketId.get(pickId);
      const market = marketsById.get(pickId);

      if (!pick || !market) {
        return;
      }

      const teamMeta = resolveComboMarketTeamCodes(market);
      updatePick(
        createComboPickFromMarket({
          market,
          outcomeSide: side,
          teamCode: teamMeta.teamCode,
          teamName: teamMeta.teamName
        })
      );
    },
    [marketsById, picksByMarketId, updatePick]
  );

  const handleRemovePick = useCallback(
    (pickId: string) => {
      removePick(pickId);
    },
    [removePick]
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_345px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-3">
          <TabSwitcher
            items={dayTabItems}
            value={day}
            onChange={(value) => setDay(value as ComboMarketsDay)}
            size="compact"
            aria-label={t("marketsTitle")}
          />

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

          {!loading && !error && groups.length === 0 ? (
            <p className="text-sm text-[#909090]">{t("emptyMarkets")}</p>
          ) : null}

          {groups.map((group) => {
            const selectedPick = group.markets
              .map((market) => picksByMarketId.get(market.id))
              .find(Boolean);
            const selectedOutcomeSide =
              selectedPick?.type === "moneyline"
                ? selectedPick.outcomeSide
                : undefined;
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
              spreadOdds: baseItemProps.spreadOdds,
              topScoreOdds: baseItemProps.topScoreOdds,
              selectedPick,
              group,
              disabledTooltip: t("cannotAddToCombo")
            });

            return (
              <ComboItem
                key={group.slug}
                {...baseItemProps}
                selectedLegsCount={selectedLegsCount}
                bttsOdds={[]}
                moneylineOdds={selectionRules.moneylineOdds}
                spreadOdds={selectionRules.spreadOdds}
                topScoreOdds={selectionRules.topScoreOdds}
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
        </div>

        <aside className="hidden lg:block lg:w-[345px] lg:shrink-0">
          <div className="lg:fixed lg:top-[78px] lg:z-20 lg:w-[345px] lg:max-h-[calc(100dvh-94px)] lg:overflow-y-auto lg:[right:max(1rem,calc((100vw-75rem)/2+1rem))]">
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
