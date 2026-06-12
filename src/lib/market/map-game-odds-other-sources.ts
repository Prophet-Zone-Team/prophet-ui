import type { ProphetGameOddsBookmaker, ProphetGetGameOddsData } from "@/types/prophet-api";
import type { FixtureMarketOutcome } from "@/types/market";
import type { MarketOtherSourceItem } from "@/views/trade/game/markets/market-other-sources";
import type { GameMarketTabId } from "@/views/trade/game/markets/fixture-market-actions";

type SupportedOddsTab = Extract<
  GameMarketTabId,
  "moneyline" | "totals" | "spreads" | "halftime" | "top_scores"
>;

const TAB_TO_ODDS_KEY: Record<
  SupportedOddsTab,
  keyof ProphetGetGameOddsData
> = {
  moneyline: "Moneyline",
  totals: "Totals",
  spreads: "Spreads",
  halftime: "HalftimeResults",
  top_scores: "ExactScore"
};

const TERNARY_SLOTS = ["Home", "Draw", "Away"] as const;

function parseDecimalOdd(odd: string): number | undefined {
  const value = Number.parseFloat(odd);

  if (!Number.isFinite(value) || value <= 1) {
    return undefined;
  }

  return value;
}

function rawImpliedProbability(odd: string): number | undefined {
  const decimalOdd = parseDecimalOdd(odd);

  if (decimalOdd === undefined) {
    return undefined;
  }

  return 1 / decimalOdd;
}

function normalizeNetPercent(
  values: Array<{ key: string; raw: number }>,
  targetKey: string
): number | undefined {
  const sum = values.reduce((total, item) => total + item.raw, 0);

  if (!Number.isFinite(sum) || sum <= 0) {
    return undefined;
  }

  const target = values.find((item) => item.key === targetKey);

  if (!target) {
    return undefined;
  }

  return Math.round((target.raw / sum) * 1000) / 10;
}

function resolveTernarySlot(
  outcome: FixtureMarketOutcome
): (typeof TERNARY_SLOTS)[number] | undefined {
  switch (outcome.side) {
    case "home":
      return "Home";
    case "draw":
      return "Draw";
    case "away":
      return "Away";
    default:
      return undefined;
  }
}

function formatSignedLine(value: number): string {
  if (Object.is(value, -0) || value === 0) {
    return "+0";
  }

  return value >= 0 ? `+${value}` : `${value}`;
}

function parseSignedSpreadFromLabel(label: string): number | undefined {
  const match = label.trim().match(/([+-])\s*(\d+(?:\.\d+)?)\s*$/);

  if (!match) {
    return undefined;
  }

  const sign = match[1] === "-" ? -1 : 1;
  return sign * Number.parseFloat(match[2] ?? "");
}

function resolveSpreadApiValue(
  outcome: FixtureMarketOutcome
): string | undefined {
  if (outcome.side !== "home" && outcome.side !== "away") {
    return undefined;
  }

  const signedSpread = parseSignedSpreadFromLabel(outcome.label);

  if (signedSpread === undefined || !Number.isFinite(signedSpread)) {
    return undefined;
  }

  const sideLabel = outcome.side === "home" ? "Home" : "Away";
  return `${sideLabel} ${formatSignedLine(signedSpread)}`;
}

function resolveTotalApiValue(
  outcome: FixtureMarketOutcome
): string | undefined {
  if (outcome.line === undefined || !Number.isFinite(outcome.line)) {
    return undefined;
  }

  if (outcome.side === "over") {
    return `Over ${outcome.line}`;
  }

  if (outcome.side === "under") {
    return `Under ${outcome.line}`;
  }

  return undefined;
}

function linesMatch(left: number, right: number): boolean {
  return Math.abs(left - right) < 0.001;
}

function parseSpreadApiValue(value: string): { side: "home" | "away"; line: number } | undefined {
  const match = value.trim().match(/^(Home|Away)\s*([+-]?\d+(?:\.\d+)?|\+0)$/i);

  if (!match) {
    return undefined;
  }

  const side = match[1]?.toLowerCase() === "away" ? "away" : "home";
  const rawLine = match[2] ?? "";
  const line = rawLine === "+0" ? 0 : Number.parseFloat(rawLine);

  if (!Number.isFinite(line)) {
    return undefined;
  }

  return { side, line };
}

function parseTotalApiValue(
  value: string
): { side: "over" | "under"; line: number } | undefined {
  const match = value.trim().match(/^(Over|Under)\s*(\d+(?:\.\d+)?)$/i);

  if (!match) {
    return undefined;
  }

  const side = match[1]?.toLowerCase() === "under" ? "under" : "over";
  const line = Number.parseFloat(match[2] ?? "");

  if (!Number.isFinite(line)) {
    return undefined;
  }

  return { side, line };
}

function collectBetValues(bookmaker: ProphetGameOddsBookmaker) {
  return bookmaker.bets.flatMap((bet) => bet.values);
}

function mapTernaryBookmaker(
  bookmaker: ProphetGameOddsBookmaker,
  targetSlot: (typeof TERNARY_SLOTS)[number]
): MarketOtherSourceItem | undefined {
  const values = collectBetValues(bookmaker).filter((item) =>
    TERNARY_SLOTS.includes(item.value as (typeof TERNARY_SLOTS)[number])
  );

  const rawEntries = values
    .map((item) => {
      const raw = rawImpliedProbability(item.odd);
      return raw === undefined ? undefined : { key: item.value, raw };
    })
    .filter((item): item is { key: string; raw: number } => item !== undefined);

  const slotsPresent = new Set(rawEntries.map((item) => item.key));
  const hasAllSlots = TERNARY_SLOTS.every((slot) => slotsPresent.has(slot));

  if (!hasAllSlots) {
    return undefined;
  }

  const netPercent = normalizeNetPercent(rawEntries, targetSlot);

  if (netPercent === undefined) {
    return undefined;
  }

  return {
    sourceName: bookmaker.name,
    netPercent
  };
}

function mapTotalBookmaker(
  bookmaker: ProphetGameOddsBookmaker,
  targetValue: string,
  targetLine: number
): MarketOtherSourceItem | undefined {
  const parsedTarget = parseTotalApiValue(targetValue);

  if (!parsedTarget) {
    return undefined;
  }

  const pairValues = collectBetValues(bookmaker).filter((item) => {
    const parsed = parseTotalApiValue(item.value);
    return parsed !== undefined && linesMatch(parsed.line, targetLine);
  });

  const sides = new Set(
    pairValues
      .map((item) => parseTotalApiValue(item.value)?.side)
      .filter((side): side is "over" | "under" => side !== undefined)
  );

  if (!sides.has("over") || !sides.has("under")) {
    return undefined;
  }

  const rawEntries = pairValues
    .map((item) => {
      const raw = rawImpliedProbability(item.odd);
      return raw === undefined ? undefined : { key: item.value, raw };
    })
    .filter((item): item is { key: string; raw: number } => item !== undefined);

  const netPercent = normalizeNetPercent(rawEntries, targetValue);

  if (netPercent === undefined) {
    return undefined;
  }

  return {
    sourceName: bookmaker.name,
    netPercent
  };
}

function mapSpreadBookmaker(
  bookmaker: ProphetGameOddsBookmaker,
  targetValue: string
): MarketOtherSourceItem | undefined {
  const parsedTarget = parseSpreadApiValue(targetValue);

  if (!parsedTarget) {
    return undefined;
  }

  const oppositeSide = parsedTarget.side === "home" ? "Away" : "Home";
  const pairValue = `${oppositeSide} ${formatSignedLine(parsedTarget.line)}`;

  const pairEntries = collectBetValues(bookmaker).filter(
    (item) => item.value === targetValue || item.value === pairValue
  );

  const rawEntries = pairEntries
    .map((item) => {
      const raw = rawImpliedProbability(item.odd);
      return raw === undefined ? undefined : { key: item.value, raw };
    })
    .filter((item): item is { key: string; raw: number } => item !== undefined);

  if (rawEntries.length < 2) {
    return undefined;
  }

  const netPercent = normalizeNetPercent(rawEntries, targetValue);

  if (netPercent === undefined) {
    return undefined;
  }

  return {
    sourceName: bookmaker.name,
    netPercent
  };
}

function resolveExactScoreApiCandidates(label: string): string[] {
  const match = label.trim().match(/(\d+)\s*[-:]\s*(\d+)/);

  if (!match) {
    return [label.trim()];
  }

  const colon = `${match[1]}:${match[2]}`;
  const dash = `${match[1]}-${match[2]}`;

  return colon === dash ? [colon] : [colon, dash];
}

function mapExactScoreBookmaker(
  bookmaker: ProphetGameOddsBookmaker,
  targetCandidates: string[]
): MarketOtherSourceItem | undefined {
  const allValues = collectBetValues(bookmaker);

  const matched = allValues.find((item) =>
    targetCandidates.includes(item.value)
  );

  if (!matched) {
    return undefined;
  }

  const rawEntries = allValues
    .map((item) => {
      const raw = rawImpliedProbability(item.odd);
      return raw === undefined ? undefined : { key: item.value, raw };
    })
    .filter((item): item is { key: string; raw: number } => item !== undefined);

  if (!rawEntries.length) {
    return undefined;
  }

  const netPercent = normalizeNetPercent(rawEntries, matched.value);

  if (netPercent === undefined) {
    return undefined;
  }

  return {
    sourceName: bookmaker.name,
    netPercent
  };
}

export function mapGameOddsToOtherSources(params: {
  odds: ProphetGetGameOddsData | undefined;
  tab: GameMarketTabId;
  selectedOutcome: FixtureMarketOutcome | undefined;
  selectedBinarySide: "yes" | "no";
  homeTeamName: string;
  awayTeamName: string;
}): MarketOtherSourceItem[] {
  void params.homeTeamName;
  void params.awayTeamName;

  const { odds, tab, selectedOutcome, selectedBinarySide } = params;

  if (!odds || !selectedOutcome) {
    return [];
  }

  if (
    tab !== "moneyline" &&
    tab !== "totals" &&
    tab !== "spreads" &&
    tab !== "halftime" &&
    tab !== "top_scores"
  ) {
    return [];
  }

  const bookmakers = odds[TAB_TO_ODDS_KEY[tab]] ?? [];

  if (!bookmakers.length) {
    return [];
  }

  if (tab === "top_scores") {
    const targetCandidates = resolveExactScoreApiCandidates(selectedOutcome.label);

    const sources = bookmakers
      .map((bookmaker) => mapExactScoreBookmaker(bookmaker, targetCandidates))
      .filter((item): item is MarketOtherSourceItem => item !== undefined);

    if (selectedBinarySide === "no") {
      return sources.map((source) => ({
        sourceName: source.sourceName,
        netPercent: Math.round((100 - source.netPercent) * 10) / 10
      }));
    }

    return sources;
  }

  if (tab === "moneyline" || tab === "halftime") {
    const targetSlot = resolveTernarySlot(selectedOutcome);

    if (!targetSlot) {
      return [];
    }

    return bookmakers
      .map((bookmaker) => mapTernaryBookmaker(bookmaker, targetSlot))
      .filter((item): item is MarketOtherSourceItem => item !== undefined);
  }

  if (tab === "totals") {
    const targetValue = resolveTotalApiValue(selectedOutcome);

    if (!targetValue || selectedOutcome.line === undefined) {
      return [];
    }

    return bookmakers
      .map((bookmaker) =>
        mapTotalBookmaker(bookmaker, targetValue, selectedOutcome.line!)
      )
      .filter((item): item is MarketOtherSourceItem => item !== undefined);
  }

  const targetValue = resolveSpreadApiValue(selectedOutcome);

  if (!targetValue) {
    return [];
  }

  return bookmakers
    .map((bookmaker) => mapSpreadBookmaker(bookmaker, targetValue))
    .filter((item): item is MarketOtherSourceItem => item !== undefined);
}
