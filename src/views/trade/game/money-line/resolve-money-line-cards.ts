import { findFixtureGroupByType } from "@/views/trade/game/markets/fixture-market-actions";
import type { GameFixtureMarketsSnapshot } from "@/types/market";
import {
  MONEY_LINE_CARD_ORDER,
  type MoneyLineCardDefinition,
  type MoneyLineCardId,
} from "./types";

const CARD_META: Record<
  MoneyLineCardId,
  Pick<MoneyLineCardDefinition, "titleKey" | "chartKind" | "summaryMode">
> = {
  team_to_advance: {
    titleKey: "teamToAdvance",
    chartKind: "team_to_advance",
    summaryMode: "binary",
  },
  moneyline: {
    titleKey: "moneyline",
    chartKind: "moneyline",
    summaryMode: "ternary",
  },
  extra_time: {
    titleKey: "extraTimeQuestion",
    chartKind: "extra_time",
    summaryMode: "binary",
  },
  penalty_shootout: {
    titleKey: "penaltyShootoutQuestion",
    chartKind: "penalty_shootout",
    summaryMode: "binary",
  },
};

export function resolveMoneyLineCards(
  fixtureMarkets: GameFixtureMarketsSnapshot,
): MoneyLineCardDefinition[] {
  return MONEY_LINE_CARD_ORDER.flatMap((id) => {
    const group = findFixtureGroupByType(fixtureMarkets.lines, id);

    if (!group?.outcomes.length) {
      return [];
    }

    return [
      {
        id,
        ...CARD_META[id],
        group,
      },
    ];
  });
}

export function resolveDefaultOutcomeForCard(
  card: MoneyLineCardDefinition,
) {
  const { group, id } = card;

  if (id === "moneyline") {
    return (
      group.outcomes.find((item) => item.side === "home") ?? group.outcomes[0]
    );
  }

  if (id === "team_to_advance") {
    return (
      group.outcomes.find((item) => item.side === "home") ?? group.outcomes[0]
    );
  }

  return group.outcomes[0];
}
