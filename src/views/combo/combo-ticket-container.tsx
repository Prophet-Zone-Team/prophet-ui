"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";

import { useAuth } from "@/context/auth";
import { useComboTicket } from "@/hooks/combo/use-combo-ticket";
import {
  buildComboTicketLeg,
  comboPickToTicketLeg,
  resolveReferencePrice,
} from "@/lib/combo/markets-client";
import { resolveTradeTicketAvailableCash } from "@/lib/trading/cash-balance-model";
import {
  useComboBidAmount,
  useComboPicks,
  useRemoveComboPick,
  useSetComboBidAmount,
  useSetComboPicks,
  useUpdateComboPickOutcome,
} from "@/store/combo-store";
import type { ComboMarketRecord } from "@/types/combo";
import { ComboWidget } from "@/views/combo/combo-widget";
import { MIN_COMBO_PICKS } from "@/views/combo/combo-widget/constants";
import type {
  ComboPick,
  ComboPickOutcomeSide,
} from "@/views/combo/combo-widget/types";

export interface ComboTicketContainerProps {
  className?: string;
}

export function ComboTicketContainer({ className }: ComboTicketContainerProps) {
  const t = useTranslations("combo");
  const auth = useAuth();
  const picks = useComboPicks();
  const bidAmount = useComboBidAmount();
  const setBidAmount = useSetComboBidAmount();
  const setPicks = useSetComboPicks();
  const updatePickOutcome = useUpdateComboPickOutcome();
  const removePick = useRemoveComboPick();

  const legs = useMemo(
    () =>
      picks
        .map((pick) => comboPickToTicketLeg(pick))
        .filter((leg): leg is NonNullable<typeof leg> => Boolean(leg)),
    [picks],
  );

  const ticket = useComboTicket({
    legs,
    bidAmount,
    enabled: legs.length >= MIN_COMBO_PICKS && bidAmount > 0,
    onSubmitSuccess: () => setPicks([]),
  });

  const balance = useMemo(
    () => resolveTradeTicketAvailableCash(auth.readiness) ?? 0,
    [auth.readiness],
  );

  const handlePickOutcomeChange = useCallback(
    (pickId: string, side: ComboPickOutcomeSide) => {
      updatePickOutcome(pickId, side);
    },
    [updatePickOutcome],
  );

  const handleRemovePick = useCallback(
    (pickId: string) => {
      removePick(pickId);
    },
    [removePick],
  );

  return (
    <ComboWidget
      className={className}
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
  );
}

export function createComboPickFromMarket(input: {
  market: ComboMarketRecord;
  outcomeSide?: ComboPickOutcomeSide;
  teamCode?: string;
  teamName?: string;
}): ComboPick {
  const outcomeSide = input.outcomeSide ?? "yes";
  const leg = buildComboTicketLeg({
    id: input.market.id,
    market: input.market,
    outcomeSide,
  });
  const selectionLabel =
    outcomeSide === "yes" ? input.market.outcomes[0] : input.market.outcomes[1];

  return {
    id: input.market.id,
    type: "moneyline",
    outcomeSide,
    matchupLabel: input.market.title,
    team: {
      name: input.teamName ?? selectionLabel,
      code: input.teamCode ?? selectionLabel.slice(0, 3).toUpperCase(),
      logoUrl: input.market.image,
    },
    selectionLabel,
    legPositionId: leg.legPositionId,
    referencePrice: resolveReferencePrice(input.market, outcomeSide),
  };
}
