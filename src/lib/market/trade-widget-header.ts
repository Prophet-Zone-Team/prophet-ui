import type {
  FixtureMarketOutcome,
  MatchOutcomeSide,
  OrderOutcomeSide
} from "@/types/market";

export type TradeWidgetHeaderIconKind =
  | { kind: "none" }
  | { kind: "team"; side: "home" | "away" }
  | { kind: "draw" }
  | {
      kind: "split";
      variant: "over_under" | "yes_no";
      activeSide: "left" | "right";
    };

export function formatMatchVersusTitle(homeName: string, awayName: string): string {
  return `${homeName} vs ${awayName}`;
}

export function resolveTradeWidgetHeaderTitle(
  outcome: FixtureMarketOutcome | null,
  homeName: string,
  awayName: string
): string {
  if (!outcome) {
    return formatMatchVersusTitle(homeName, awayName);
  }

  switch (outcome.marketType) {
    case "spread":
      return "Spreads";
    case "total":
      return "Totals";
    case "btts":
      return "Both Teams to Score?";
    case "team_to_advance":
      return "Team to Advance";
    case "extra_time":
      return "Extra Time?";
    case "penalty_shootout":
      return "Penalty Shootout?";
    case "exact_score":
      return "Exact Score";
    case "halftime":
      return "Half-time Result";
    case "moneyline":
    default:
      return formatMatchVersusTitle(homeName, awayName);
  }
}

export function resolveTradeWidgetHeaderIconKind(
  outcome: FixtureMarketOutcome | null,
  matchOutcomeSide: MatchOutcomeSide,
  outcomeSide: OrderOutcomeSide
): TradeWidgetHeaderIconKind {
  if (!outcome) {
    return resolveMatchSideIconKind(matchOutcomeSide);
  }

  switch (outcome.marketType) {
    case "exact_score":
      return { kind: "none" };
    case "total":
      return {
        kind: "split",
        variant: "over_under",
        activeSide: resolveTotalActiveSide(outcome, outcomeSide)
      };
    case "btts":
    case "extra_time":
    case "penalty_shootout":
      return {
        kind: "split",
        variant: "yes_no",
        activeSide: outcomeSide === "no" ? "right" : "left"
      };
    case "moneyline":
    case "halftime":
    case "spread":
    case "team_to_advance":
      return resolveFixtureSideIconKind(outcome.side, matchOutcomeSide);
    default:
      return resolveMatchSideIconKind(matchOutcomeSide);
  }
}

function resolveMatchSideIconKind(side: MatchOutcomeSide): TradeWidgetHeaderIconKind {
  if (side === "draw") {
    return { kind: "draw" };
  }

  if (side === "away") {
    return { kind: "team", side: "away" };
  }

  return { kind: "team", side: "home" };
}

function resolveFixtureSideIconKind(
  side: FixtureMarketOutcome["side"],
  fallback: MatchOutcomeSide
): TradeWidgetHeaderIconKind {
  if (side === "home" || side === "away" || side === "draw") {
    return resolveMatchSideIconKind(side);
  }

  return resolveMatchSideIconKind(fallback);
}

function resolveTotalActiveSide(
  outcome: FixtureMarketOutcome,
  outcomeSide: OrderOutcomeSide
): "left" | "right" {
  if (outcome.side === "under" || outcomeSide === "no") {
    return "right";
  }

  return "left";
}
