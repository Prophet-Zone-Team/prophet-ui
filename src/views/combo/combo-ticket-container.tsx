"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";

import { useAuth } from "@/context/auth";
import { useComboTicket } from "@/hooks/combo/use-combo-ticket";
import { isSpreadMarket } from "@/lib/combo/combo-market-mutex";
import {
  resolveComboPickSelectionLabel,
  resolveComboPickTeam,
  resolveSpreadLineForMarket,
  resolveSpreadOptionsForTeam,
} from "@/lib/combo/map-market-to-combo-item";
import {
  resolveComboLegOutcomeSide,
  resolveComboPickStoredOutcomeSide,
} from "@/lib/combo/combo-pick-outcome";
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
import type { ComboGameGroup, ComboMarketRecord } from "@/types/combo";
import { ComboWidget } from "@/views/combo/combo-widget";
import { MIN_COMBO_PICKS } from "@/views/combo/combo-widget/constants";
import type {
  ComboPick,
  ComboPickOutcomeSide,
  ComboSpreadPick,
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
    onSubmitSuccess: () => {
      setPicks([]);
      setBidAmount(0);
    },
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
  group?: ComboGameGroup;
  outcomeSide?: ComboPickOutcomeSide;
  teamCode?: string;
  teamName?: string;
}): ComboPick {
  if (isSpreadMarket(input.market) && input.group) {
    return createComboSpreadPickFromMarket(input.market, input.group);
  }

  const requestedSide = input.outcomeSide ?? "yes";
  const storedOutcomeSide = resolveComboPickStoredOutcomeSide(
    input.market,
    requestedSide,
  );
  const legOutcomeSide = resolveComboLegOutcomeSide(
    input.market,
    storedOutcomeSide,
  );
  const leg = buildComboTicketLeg({
    id: input.market.id,
    market: input.market,
    outcomeSide: legOutcomeSide,
  });
  const selectionLabel = resolveComboPickSelectionLabel(
    input.market,
    storedOutcomeSide,
  );
  const team = resolveComboPickTeam(input.market, storedOutcomeSide);

  return {
    id: input.market.id,
    type: "moneyline",
    outcomeSide: storedOutcomeSide,
    matchupLabel: input.group?.title ?? input.market.title,
    team,
    selectionLabel,
    legPositionId: leg.legPositionId,
    referencePrice: resolveReferencePrice(input.market, legOutcomeSide),
  };
}

function createComboSpreadPickFromMarket(
  market: ComboMarketRecord,
  group: ComboGameGroup,
): ComboSpreadPick {
  const team = resolveComboPickTeam(market, "yes");
  const spreadValue = resolveSpreadLineForMarket(market, group) ?? "";
  const spreadOptions = resolveSpreadOptionsForTeam(group, team.code);
  const leg = buildComboTicketLeg({
    id: market.id,
    market,
    outcomeSide: "yes",
  });

  return {
    id: market.id,
    type: "spread",
    spreadValue,
    spreadOptions,
    matchupLabel: group.title,
    team,
    selectionLabel: resolveComboPickSelectionLabel(market, "yes"),
    legPositionId: leg.legPositionId,
    referencePrice: resolveReferencePrice(market, "yes"),
  };
}
