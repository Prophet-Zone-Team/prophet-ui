"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";

import { useAuth } from "@/context/auth";
import { useComboMarkets } from "@/hooks/combo/use-combo-markets";
import { useComboTicket } from "@/hooks/combo/use-combo-ticket";
import { buildComboLegsFromPicks } from "@/lib/combo/markets-client";
import {
  mapComboMarketToItemProps,
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
  useUpsertComboPick
} from "@/store/combo-store";
import type { ComboMarketRecord } from "@/types/combo";
import { ComboItem } from "@/views/combo/combo-item";
import type { ComboOddsOption } from "@/views/combo/combo-item/types";
import { ComboWidget } from "@/views/combo/combo-widget";
import type { ComboPickOutcomeSide } from "@/views/combo/combo-widget/types";
import { createComboPickFromMarket } from "@/views/combo/combo-ticket-container";
import { MIN_COMBO_PICKS } from "@/views/combo/combo-widget/constants";

export function ComboPageView() {
  const t = useTranslations("combo");
  const auth = useAuth();
  const { markets, loading, error, reload } = useComboMarkets();
  const picks = useComboPicks();
  const bidAmount = useComboBidAmount();
  const upsertPick = useUpsertComboPick();
  const updatePick = useUpdateComboPick();
  const removePick = useRemoveComboPick();
  const setBidAmount = useSetComboBidAmount();
  const setPicks = useSetComboPicks();

  const legs = useMemo(
    () => buildComboLegsFromPicks(picks, markets),
    [markets, picks]
  );

  const ticket = useComboTicket({
    legs,
    bidAmount,
    enabled: legs.length >= MIN_COMBO_PICKS && bidAmount > 0,
    onSubmitSuccess: () => setPicks([]),
  });

  const balance = useMemo(
    () => resolveTradeTicketAvailableCash(auth.readiness) ?? 0,
    [auth.readiness]
  );

  const picksByMarketId = useMemo(() => {
    const map = new Map<string, (typeof picks)[number]>();

    for (const pick of picks) {
      map.set(pick.id, pick);
    }

    return map;
  }, [picks]);

  const handleSelectMarketOdds = useCallback(
    (market: ComboMarketRecord, option: ComboOddsOption) => {
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

      const teamMeta = resolveComboMarketTeamCodes(market);
      const pick = createComboPickFromMarket({
        market,
        outcomeSide: parsed.outcomeSide,
        teamCode: teamMeta.teamCode,
        teamName: teamMeta.teamName
      });

      upsertPick(pick);
    },
    [picksByMarketId, removePick, upsertPick]
  );

  const handlePickOutcomeChange = useCallback(
    (pickId: string, side: ComboPickOutcomeSide) => {
      const pick = picksByMarketId.get(pickId);
      const market = markets.find((entry) => entry.id === pickId);

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
    [markets, picksByMarketId, updatePick]
  );

  const handleRemovePick = useCallback(
    (pickId: string) => {
      removePick(pickId);
    },
    [removePick]
  );

  return (
    <section className="mx-auto w-full max-w-[1200px] px-3 pb-8 pt-4 md:px-4 md:pt-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_345px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-3">
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

          {!loading && !error && markets.length === 0 ? (
            <p className="text-sm text-[#909090]">{t("emptyMarkets")}</p>
          ) : null}

          {markets.map((market) => {
            const selectedPick = picksByMarketId.get(market.id);
            const selectedOutcomeSide =
              selectedPick?.type === "moneyline"
                ? selectedPick.outcomeSide
                : undefined;

            return (
              <ComboItem
                key={market.id}
                {...mapComboMarketToItemProps(market, {
                  selectedOutcomeSide,
                  isInCombo: Boolean(selectedPick)
                })}
                onSelectOdds={(option) =>
                  handleSelectMarketOdds(market, option)
                }
              />
            );
          })}
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <ComboWidget
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
            onPickOutcomeChange={handlePickOutcomeChange}
            onRemovePick={handleRemovePick}
            onConnectWallet={() => void auth.openLogin()}
            onSubmit={ticket.submit}
          />
        </aside>
      </div>
    </section>
  );
}
