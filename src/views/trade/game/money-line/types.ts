import type { FixtureChartKind, FixtureMarketGroup } from "@/types/market";

export type MoneyLineCardId =
  | "team_to_advance"
  | "moneyline"
  | "extra_time"
  | "penalty_shootout";

export type MoneyLineCardDefinition = {
  id: MoneyLineCardId;
  titleKey: string;
  group: FixtureMarketGroup;
  chartKind: FixtureChartKind;
  summaryMode: "ternary" | "binary";
};

export const MONEY_LINE_CARD_ORDER: MoneyLineCardId[] = [
  "team_to_advance",
  "moneyline",
  "extra_time",
  "penalty_shootout",
];
