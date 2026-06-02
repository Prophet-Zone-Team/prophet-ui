import {
  getFixtureOutcomesForGroup,
  sortFixtureGroupOutcomes,
} from "@/lib/market/build-fixture-markets-snapshot";
import type {
  FixtureBinaryOutcomeHistoryInput,
  FixtureOutcomeHistoryInput,
} from "@/lib/market/fixture-probability-chart";
import type {
  FixtureChartKind,
  FixtureMarketGroup,
  MatchOutcomeSide,
  WorldCupMatch,
} from "@/types/market";

const TERNARY_SIDES: MatchOutcomeSide[] = ["home", "draw", "away"];

export type FixtureChartTokenResolution =
  | {
      mode: "ternary";
      inputs: Array<{ side: MatchOutcomeSide; tokenId: string }>;
    }
  | {
      mode: "binary";
      inputs: Array<{ key: "primary" | "secondary"; tokenId: string }>;
    };

function findGroupByType(
  groups: FixtureMarketGroup[],
  type: FixtureMarketGroup["type"],
): FixtureMarketGroup | undefined {
  return groups.find((group) => group.type === type);
}

function resolveHalftimeTokens(
  match: WorldCupMatch,
): FixtureChartTokenResolution | undefined {
  const outcomes = match.polymarket?.fixtureMarkets?.halftime ?? [];

  if (!outcomes.length) {
    return undefined;
  }

  const inputs = TERNARY_SIDES.flatMap((side) => {
    const outcome = outcomes.find((item) => item.side === side);

    if (!outcome?.tokenId) {
      return [];
    }

    return [{ side, tokenId: outcome.tokenId }];
  });

  if (inputs.length < 3) {
    return undefined;
  }

  return { mode: "ternary", inputs };
}

function resolveLineGroupTokens(
  group: FixtureMarketGroup | undefined,
  lineKey: string | undefined,
  groupType: "total" | "spread",
): FixtureChartTokenResolution | undefined {
  if (!group) {
    return undefined;
  }

  const resolvedLineKey =
    lineKey ?? group.defaultLineKey ?? group.lineOptionKeys?.[0]?.key;

  const outcomes = sortFixtureGroupOutcomes(
    getFixtureOutcomesForGroup(group, resolvedLineKey),
    groupType,
  );

  if (groupType === "total") {
    const over = outcomes.find((item) => item.side === "over");
    const under = outcomes.find((item) => item.side === "under");

    if (!over?.tokenId || !under?.noTokenId) {
      return undefined;
    }

    return {
      mode: "binary",
      inputs: [
        { key: "primary", tokenId: over.tokenId },
        { key: "secondary", tokenId: under.noTokenId },
      ],
    };
  }

  const home = outcomes.find((item) => item.side === "home");
  const away = outcomes.find((item) => item.side === "away");

  if (!home?.tokenId || !away?.noTokenId) {
    return undefined;
  }

  return {
    mode: "binary",
    inputs: [
      { key: "primary", tokenId: home.tokenId },
      { key: "secondary", tokenId: away.noTokenId },
    ],
  };
}

export function resolveFixtureChartTokens(
  match: WorldCupMatch,
  chartKind: FixtureChartKind,
  lineKey?: string,
): FixtureChartTokenResolution | undefined {
  if (chartKind === "moneyline") {
    const tokenOutcomes = (match.polymarket?.moneyline.outcomes ?? []).filter(
      (
        outcome
      ): outcome is typeof outcome & {
        tokenId: string;
        side: MatchOutcomeSide;
      } =>
        Boolean(outcome.tokenId) &&
        (outcome.side === "home" ||
          outcome.side === "draw" ||
          outcome.side === "away")
    );

    if (tokenOutcomes.length < 3) {
      return undefined;
    }

    return {
      mode: "ternary",
      inputs: tokenOutcomes.map((outcome) => ({
        side: outcome.side,
        tokenId: outcome.tokenId
      }))
    };
  }

  const lines = match.polymarket?.fixtureMarkets?.lines ?? [];

  if (chartKind === "halftime") {
    return resolveHalftimeTokens(match);
  }

  if (chartKind === "total") {
    return resolveLineGroupTokens(
      findGroupByType(lines, "total"),
      lineKey,
      "total"
    );
  }

  if (chartKind === "spread") {
    return resolveLineGroupTokens(
      findGroupByType(lines, "spread"),
      lineKey,
      "spread"
    );
  }

  return undefined;
}

/** Stable key for fixture chart polling; ignores live score-only match updates. */
export function buildFixtureChartFetchKey(
  match: WorldCupMatch,
  chartKind: FixtureChartKind,
  lineKey?: string,
): string {
  const resolution = resolveFixtureChartTokens(match, chartKind, lineKey);

  if (!resolution) {
    return `${match.id}|${chartKind}|${lineKey ?? ""}|`;
  }

  const tokenIds = resolution.inputs
    .map((input) => input.tokenId)
    .sort()
    .join(",");

  return `${match.id}|${chartKind}|${lineKey ?? ""}|${resolution.mode}|${tokenIds}`;
}

export function attachHistoryToTernaryInputs(
  inputs: Array<{ side: MatchOutcomeSide; tokenId: string }>,
  historyByToken: Map<string, Array<{ t: number; p: number }>>,
): FixtureOutcomeHistoryInput[] {
  return inputs.map((input) => ({
    side: input.side,
    tokenId: input.tokenId,
    history: historyByToken.get(input.tokenId) ?? [],
  }));
}

export function attachHistoryToBinaryInputs(
  inputs: Array<{ key: "primary" | "secondary"; tokenId: string }>,
  historyByToken: Map<string, Array<{ t: number; p: number }>>,
): FixtureBinaryOutcomeHistoryInput[] {
  return inputs.map((input) => ({
    key: input.key,
    tokenId: input.tokenId,
    history: historyByToken.get(input.tokenId) ?? [],
  }));
}
