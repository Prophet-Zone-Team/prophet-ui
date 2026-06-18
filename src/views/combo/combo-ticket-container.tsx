"use client";

import { useCallback, useMemo, useState } from "react";

import { useAuth } from "@/context/auth";
import { useComboTicket } from "@/hooks/combo/use-combo-ticket";
import {
  buildComboTicketLeg,
  comboPickToTicketLeg,
  resolveReferencePrice,
} from "@/lib/combo/markets-client";
import { resolveTradeTicketAvailableCash } from "@/lib/trading/cash-balance-model";
import type { ComboMarketRecord } from "@/types/combo";
import { ComboWidget } from "@/views/combo/combo-widget";
import type {
  ComboPick,
  ComboPickOutcomeSide,
} from "@/views/combo/combo-widget/types";

export interface ComboTicketContainerProps {
  initialPicks?: ComboPick[];
  defaultBidAmount?: number;
  className?: string;
}

export function ComboTicketContainer({
  initialPicks = [],
  defaultBidAmount = 0,
  className,
}: ComboTicketContainerProps) {
  const auth = useAuth();
  const [picks, setPicks] = useState<ComboPick[]>(initialPicks);
  const [bidAmount, setBidAmount] = useState(defaultBidAmount);

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
    enabled: legs.length > 0 && bidAmount > 0,
  });

  const balance = useMemo(
    () => resolveTradeTicketAvailableCash(auth.readiness) ?? 0,
    [auth.readiness],
  );

  const handlePickOutcomeChange = useCallback(
    (pickId: string, side: ComboPickOutcomeSide) => {
      setPicks((previous) =>
        previous.map((pick) => {
          if (pick.id !== pickId || pick.type !== "moneyline") {
            return pick;
          }

          return {
            ...pick,
            outcomeSide: side,
            referencePrice: pick.referencePrice,
          };
        }),
      );
    },
    [],
  );

  const handleRemovePick = useCallback((pickId: string) => {
    setPicks((previous) => previous.filter((pick) => pick.id !== pickId));
  }, []);

  return (
    <ComboWidget
      className={className}
      picks={picks}
      multiplier={ticket.multiplier}
      bidAmount={bidAmount}
      balance={balance}
      toWinAmount={ticket.toWinAmount}
      isSubmitting={ticket.isSubmitting}
      isSubmitDisabled={ticket.isSubmitDisabled}
      onBidAmountChange={setBidAmount}
      onPickOutcomeChange={handlePickOutcomeChange}
      onRemovePick={handleRemovePick}
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
