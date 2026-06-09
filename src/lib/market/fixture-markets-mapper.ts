import {
  firstGammaNumber,
  normalizeGammaSearchText,
  parseGammaArrayField,
  priceToProbability,
  toGammaNumber,
  type GammaMarketRecord,
} from "@/lib/market/polymarket-gamma";
import { sortFixtureGroupOutcomes } from "@/lib/market/build-fixture-markets-snapshot";
import type {
  FixtureLineOption,
  FixtureMarketGroup,
  FixtureMarketOutcome,
  FixtureOutcomeSide,
  FixtureSportsMarketType,
  MatchOutcomeSide,
  PolymarketFixtureMarketsData,
  PolymarketFixtureMoneylineOutcome,
} from "@/types/market";

interface ParsedMarketSide {
  side?: FixtureOutcomeSide;
  line?: number;
  spreadValue?: number;
  label: string;
}

interface SpreadMarketBundle {
  lineKey: string;
  lineLabel: number;
  favoredSide: MatchOutcomeSide;
  outcomes: FixtureMarketOutcome[];
  volume?: number;
}

export function mapEventSportsMarkets(
  markets: GammaMarketRecord[],
  homeName: string,
  awayName: string,
  moneylineOutcomes: PolymarketFixtureMoneylineOutcome[] = []
): PolymarketFixtureMarketsData {
  const spreadMarkets: SpreadMarketBundle[] = [];
  const totalOutcomes: FixtureMarketOutcome[] = [];
  const bttsOutcomes: FixtureMarketOutcome[] = [];
  const exactScores: FixtureMarketOutcome[] = [];
  const halftime: FixtureMarketOutcome[] = [];

  for (const market of markets) {
    const marketType = classifySportsMarketType(market);

    if (!marketType || marketType === "moneyline") {
      continue;
    }

    if (marketType === "total") {
      totalOutcomes.push(
        ...mapTotalMarketToFixtureOutcomes(market, homeName, awayName)
      );
      continue;
    }

    if (marketType === "spread") {
      const spreadMarket = mapSpreadMarketToFixtureOutcomes(
        market,
        homeName,
        awayName
      );

      if (spreadMarket) {
        spreadMarkets.push(spreadMarket);
      }

      continue;
    }

    const outcome = mapMarketToFixtureOutcome(
      market,
      marketType,
      homeName,
      awayName
    );

    if (!outcome) {
      continue;
    }

    switch (marketType) {
      case "btts": {
        const conditionId = market.conditionId;
        if (
          conditionId &&
          bttsOutcomes.some((item) => item.conditionId === conditionId)
        ) {
          break;
        }
        bttsOutcomes.push(outcome);
        break;
      }
      case "exact_score":
        exactScores.push(outcome);
        break;
      case "halftime":
        halftime.push(outcome);
        break;
      default:
        break;
    }
  }

  const lines: FixtureMarketGroup[] = [];

  const moneylineGroup = buildMoneylineGroup(
    moneylineOutcomes,
    homeName,
    awayName
  );
  if (moneylineGroup) {
    lines.push(moneylineGroup);
  }

  const spreadGroup = buildSpreadGroup(spreadMarkets);
  if (spreadGroup) {
    lines.push(spreadGroup);
  }

  const totalGroup = buildLineGroupedMarket("total", "Totals", totalOutcomes);
  if (totalGroup) {
    lines.push(totalGroup);
  }

  const bttsGroup = buildBttsGroup(bttsOutcomes);
  if (bttsGroup) {
    lines.push(bttsGroup);
  }

  return {
    lines,
    exactScores: sortExactScores(exactScores),
    halftime: sortHalftimeOutcomes(halftime, homeName, awayName)
  };
}

export function moneylineOutcomeToFixtureOutcome(
  outcome: PolymarketFixtureMoneylineOutcome,
  homeName: string,
  awayName: string,
): FixtureMarketOutcome {
  const shortLabel =
    outcome.side === "draw"
      ? "Draw"
      : outcome.side === "home"
        ? abbreviateTeamName(homeName)
        : abbreviateTeamName(awayName);

  return {
    id: `moneyline:${outcome.side}`,
    marketType: "moneyline",
    category: "lines",
    label: shortLabel,
    side: outcome.side,
    probability: outcome.probability,
    price: resolveOutcomePrice(outcome.probability, outcome.yesAsk),
    volume: outcome.volume,
    tokenId: outcome.tokenId,
    noTokenId: outcome.noTokenId,
    conditionId: outcome.conditionId,
    yesAsk: outcome.yesAsk,
    yesBid: outcome.yesBid,
    noAsk: outcome.noAsk,
    noBid: outcome.noBid,
    fee: outcome.fee,
    acceptingOrders: Boolean(outcome.tokenId),
  };
}

function buildMoneylineGroup(
  outcomes: PolymarketFixtureMoneylineOutcome[],
  homeName: string,
  awayName: string,
): FixtureMarketGroup | undefined {
  if (!outcomes.length) {
    return undefined;
  }

  const fixtureOutcomes = sortFixtureGroupOutcomes(
    outcomes.map((outcome) =>
      moneylineOutcomeToFixtureOutcome(outcome, homeName, awayName),
    ),
    "moneyline",
  );
  const volume = fixtureOutcomes.reduce((sum, item) => sum + (item.volume ?? 0), 0);

  return {
    type: "moneyline",
    title: "Moneyline",
    volume,
    outcomes: fixtureOutcomes,
  };
}

function buildSpreadGroup(
  markets: SpreadMarketBundle[],
): FixtureMarketGroup | undefined {
  if (!markets.length) {
    return undefined;
  }

  const sortedMarkets = [...markets].sort((left, right) => {
    if (left.lineLabel !== right.lineLabel) {
      return left.lineLabel - right.lineLabel;
    }

    if (left.favoredSide === right.favoredSide) {
      return left.lineKey.localeCompare(right.lineKey);
    }

    return left.favoredSide === "home" ? -1 : 1;
  });

  const lineOptionKeys: FixtureLineOption[] = [];
  const outcomesByLine: Record<string, FixtureMarketOutcome[]> = {};
  const outcomes: FixtureMarketOutcome[] = [];
  let volume = 0;

  for (const market of sortedMarkets) {
    lineOptionKeys.push({
      key: market.lineKey,
      label: market.lineLabel,
    });
    outcomesByLine[market.lineKey] = market.outcomes;
    outcomes.push(...market.outcomes);
    volume += market.volume ?? 0;
  }

  const defaultMarket =
    sortedMarkets.find(
      (market) => market.favoredSide === "home" && market.lineLabel === 1.5,
    ) ??
    sortedMarkets.find((market) => market.favoredSide === "home") ??
    sortedMarkets[0];
  const lineOptions = lineOptionKeys.map((option) => option.label);

  return {
    type: "spread",
    title: "Spreads",
    volume,
    lineOptions,
    lineOptionKeys,
    defaultLine: defaultMarket?.lineLabel,
    defaultLineKey: defaultMarket?.lineKey,
    outcomesByLine,
    outcomes,
  };
}

function buildLineGroupedMarket(
  type: Extract<FixtureSportsMarketType, "spread" | "total">,
  title: string,
  outcomes: FixtureMarketOutcome[],
): FixtureMarketGroup | undefined {
  if (!outcomes.length) {
    return undefined;
  }

  const outcomesByLine: Record<string, FixtureMarketOutcome[]> = {};
  const lineSet = new Set<number>();

  for (const outcome of outcomes) {
    if (outcome.line === undefined) {
      continue;
    }

    lineSet.add(outcome.line);
    const key = String(outcome.line);
    outcomesByLine[key] = [...(outcomesByLine[key] ?? []), outcome];
  }

  const lineOptions = [...lineSet].sort((left, right) => left - right);
  const lineOptionKeys: FixtureLineOption[] = lineOptions.map((line) => ({
    key: String(line),
    label: line,
  }));
  const defaultLine = lineOptions.includes(2.5)
    ? 2.5
    : lineOptions.includes(1.5)
      ? 1.5
      : lineOptions[0];
  const volume = outcomes.reduce((sum, item) => sum + (item.volume ?? 0), 0);

  return {
    type,
    title,
    volume,
    lineOptions,
    lineOptionKeys,
    defaultLine,
    defaultLineKey: defaultLine !== undefined ? String(defaultLine) : undefined,
    outcomesByLine,
    outcomes,
  };
}

function buildBttsGroup(outcomes: FixtureMarketOutcome[]): FixtureMarketGroup | undefined {
  if (!outcomes.length) {
    return undefined;
  }

  const volume = outcomes.reduce((sum, item) => sum + (item.volume ?? 0), 0);

  return {
    type: "btts",
    title: "Both Teams to Score?",
    volume,
    outcomes,
  };
}

function classifySportsMarketType(market: GammaMarketRecord): FixtureSportsMarketType | null {
  const type = normalizeGammaSearchText(market.sportsMarketType ?? "");
  const question = normalizeGammaSearchText(market.question ?? market.title ?? "");

  if (type === "moneyline" || type === "ml") {
    return "moneyline";
  }

  if (type === "spreads" || type === "spread") {
    return "spread";
  }

  if (type === "totals" || type === "total") {
    return "total";
  }

  if (
    type === "both_teams_to_score" ||
    type === "btts" ||
    (type.includes("both") && type.includes("score"))
  ) {
    return "btts";
  }

  if (
    type === "exact_score" ||
    type === "correct_score" ||
    type === "soccer_exact_score" ||
    type.includes("exact") ||
    type.includes("correct score")
  ) {
    return "exact_score";
  }

  if (
    type === "first_half" ||
    type === "halftime" ||
    type === "soccer_halftime_result" ||
    type === "1h_moneyline" ||
    type.includes("first half") ||
    type.includes("halftime result")
  ) {
    return "halftime";
  }

  if (question.includes("first 45 minutes")) {
    return "halftime";
  }

  if (question.includes("both teams to score") || question.includes("both teams score")) {
    return "btts";
  }

  if (question.includes("exact score") || question.includes("final score")) {
    return "exact_score";
  }

  if (question.includes("combine to score") || question.includes("over") && question.includes("under")) {
    if (question.includes("over") && question.includes("under")) {
      return "total";
    }
  }

  if (question.includes("win by") && (question.includes("goal") || question.includes("goals"))) {
    return "spread";
  }

  return null;
}

function mapSpreadMarketToFixtureOutcomes(
  market: GammaMarketRecord,
  homeName: string,
  awayName: string,
): SpreadMarketBundle | undefined {
  const yesOutcome = getYesMarketOutcome(market);
  const noOutcome = getNoMarketOutcome(market);

  if (!yesOutcome.tokenId || !market.conditionId) {
    return undefined;
  }

  const groupTitle = market.groupItemTitle?.trim() ?? "";
  const question = market.question ?? market.title ?? "";
  const parsed = parseSpreadLabel(groupTitle || question, homeName, awayName);

  if (
    (parsed.side !== "home" && parsed.side !== "away") ||
    parsed.line === undefined ||
    parsed.spreadValue === undefined
  ) {
    return undefined;
  }

  const favoredSide = parsed.side;
  const otherSide: MatchOutcomeSide = favoredSide === "home" ? "away" : "home";
  const complementSpread = -parsed.spreadValue;
  const lineKey = `spread:${market.conditionId}`;
  const shared = {
    marketType: "spread" as const,
    category: "lines" as const,
    line: parsed.line,
    volume: yesOutcome.volume,
    conditionId: market.conditionId,
    tokenId: yesOutcome.tokenId,
    noTokenId: noOutcome.tokenId,
    yesAsk: yesOutcome.yesAsk,
    yesBid: yesOutcome.yesBid,
    noAsk: noOutcome.yesAsk,
    noBid: noOutcome.yesBid,
    acceptingOrders: market.acceptingOrders === true,
  };

  return {
    lineKey,
    lineLabel: parsed.line,
    favoredSide,
    volume: yesOutcome.volume,
    outcomes: [
      {
        ...shared,
        id: `${lineKey}:yes`,
        label: formatSpreadLabel(favoredSide, parsed.spreadValue, homeName, awayName),
        side: favoredSide,
        probability: yesOutcome.probability,
        price: resolveOutcomePrice(yesOutcome.probability, yesOutcome.yesAsk),
      },
      {
        ...shared,
        id: `${lineKey}:no`,
        label: formatSpreadLabel(otherSide, complementSpread, homeName, awayName),
        side: otherSide,
        probability: priceToProbability(noOutcome.yesAsk) ?? 0,
        price: resolveOutcomePrice(
          priceToProbability(noOutcome.yesAsk) ?? 0,
          noOutcome.yesAsk,
        ),
      },
    ],
  };
}

function formatSpreadLabel(
  side: MatchOutcomeSide,
  spreadValue: number,
  homeName: string,
  awayName: string,
): string {
  const teamAbbrev =
    side === "home"
      ? abbreviateTeamName(homeName)
      : side === "away"
        ? abbreviateTeamName(awayName)
        : side.toUpperCase();
  const spreadLabel = `${spreadValue >= 0 ? "+" : ""}${spreadValue}`;

  return `${teamAbbrev} ${spreadLabel}`;
}

function mapTotalMarketToFixtureOutcomes(
  market: GammaMarketRecord,
  homeName: string,
  awayName: string,
): FixtureMarketOutcome[] {
  const yesOutcome = getYesMarketOutcome(market);
  const noOutcome = getNoMarketOutcome(market);

  if (!yesOutcome.tokenId) {
    return [];
  }

  const groupTitle = market.groupItemTitle?.trim() ?? "";
  const question = market.question ?? market.title ?? "";
  const parsed = parseTotalLabel(groupTitle || question);
  const line = parsed.line;

  if (line === undefined) {
    const fallback = mapMarketToFixtureOutcome(market, "total", homeName, awayName);

    return fallback ? [fallback] : [];
  }

  const overId = `total:${line}:over`;
  const underId = `total:${line}:under`;
  const shared = {
    marketType: "total" as const,
    category: "lines" as const,
    line,
    volume: yesOutcome.volume,
    conditionId: market.conditionId,
    acceptingOrders: market.acceptingOrders === true,
  };

  return [
    {
      ...shared,
      id: overId,
      label: `O ${line}`,
      side: "over",
      probability: yesOutcome.probability,
      price: resolveOutcomePrice(yesOutcome.probability, yesOutcome.yesAsk),
      tokenId: yesOutcome.tokenId,
      noTokenId: noOutcome.tokenId,
      yesAsk: yesOutcome.yesAsk,
      yesBid: yesOutcome.yesBid,
      noAsk: noOutcome.yesAsk,
      noBid: noOutcome.yesBid
    },
    {
      ...shared,
      id: underId,
      label: `U ${line}`,
      side: "under",
      probability: priceToProbability(noOutcome.yesAsk) ?? 0,
      price: resolveOutcomePrice(
        priceToProbability(noOutcome.yesAsk) ?? 0,
        noOutcome.yesAsk
      ),
      tokenId: yesOutcome.tokenId,
      noTokenId: noOutcome.tokenId,
      yesAsk: yesOutcome.yesAsk,
      yesBid: yesOutcome.yesBid,
      noAsk: noOutcome.yesAsk,
      noBid: noOutcome.yesBid
    }
  ];
}

function mapMarketToFixtureOutcome(
  market: GammaMarketRecord,
  marketType: FixtureSportsMarketType,
  homeName: string,
  awayName: string,
): FixtureMarketOutcome | undefined {
  const yesOutcome = getYesMarketOutcome(market);
  const noOutcome = getNoMarketOutcome(market);

  if (!yesOutcome.tokenId) {
    return undefined;
  }

  const category =
    marketType === "exact_score"
      ? "exact_score"
      : marketType === "halftime"
        ? "halftime"
        : "lines";

  const parsed = parseMarketLabel(
    market,
    marketType,
    homeName,
    awayName,
  );

  const id = buildOutcomeId(marketType, parsed, market.conditionId);

  return {
    id,
    marketType,
    category,
    label: parsed.label,
    side: parsed.side,
    line: parsed.line,
    probability: yesOutcome.probability,
    price: resolveOutcomePrice(yesOutcome.probability, yesOutcome.yesAsk),
    volume: yesOutcome.volume,
    tokenId: yesOutcome.tokenId,
    noTokenId: noOutcome.tokenId,
    conditionId: market.conditionId,
    yesAsk: yesOutcome.yesAsk,
    yesBid: yesOutcome.yesBid,
    noAsk: noOutcome.yesAsk,
    noBid: noOutcome.yesBid,
    acceptingOrders: market.acceptingOrders === true,
  };
}

function parseMarketLabel(
  market: GammaMarketRecord,
  marketType: FixtureSportsMarketType,
  homeName: string,
  awayName: string,
): ParsedMarketSide {
  const groupTitle = market.groupItemTitle?.trim() ?? "";
  const question = market.question ?? market.title ?? "";

  if (marketType === "exact_score") {
    const score = parseExactScoreLabel(groupTitle, question);
    return {
      label: score ?? (groupTitle || "Other"),
    };
  }

  if (marketType === "halftime") {
    const side =
      classifyHalftimeSide(groupTitle, homeName, awayName) ??
      classifyHalftimeSide(question, homeName, awayName);
    const label =
      side === "draw"
        ? "Draw"
        : side === "home"
          ? abbreviateTeamName(homeName)
          : side === "away"
            ? abbreviateTeamName(awayName)
            : groupTitle || question.slice(0, 24);

    return { side, label };
  }

  if (marketType === "btts") {
    return { side: "yes", label: "Yes" };
  }

  if (marketType === "spread") {
    return parseSpreadLabel(groupTitle || question, homeName, awayName);
  }

  if (marketType === "total") {
    return parseTotalLabel(groupTitle || question);
  }

  return { label: groupTitle || question.slice(0, 24) };
}

function parseSpreadLabel(
  text: string,
  homeName: string,
  awayName: string,
): ParsedMarketSide {
  const normalized = text.trim().replace(/\(([^)]+)\)/, " $1 ").replace(/\s+/g, " ").trim();
  const match = normalized.match(/(.+?)\s*([+-])\s*(\d+(?:\.\d+)?)/i);

  if (!match) {
    return { label: normalized };
  }

  const teamPart = match[1]?.trim() ?? "";
  const sign = match[2] === "-" ? -1 : 1;
  const lineValue = Number(match[3]);
  const spreadValue = sign * lineValue;
  const side = classifyTeamSide(teamPart, homeName, awayName);
  const teamAbbrev =
    side === "home"
      ? abbreviateTeamName(homeName)
      : side === "away"
        ? abbreviateTeamName(awayName)
        : abbreviateTeamName(teamPart);
  const spreadLabel = `${spreadValue >= 0 ? "+" : ""}${spreadValue}`;

  return {
    side,
    line: lineValue,
    spreadValue,
    label: `${teamAbbrev} ${spreadLabel}`,
  };
}

function parseTotalLine(text: string): number | undefined {
  const normalized = text.trim();
  const ouMatch = normalized.match(/^O\s*\/\s*U\s*(\d+(?:\.\d+)?)/i);

  if (ouMatch) {
    return Number(ouMatch[1]);
  }

  const sideMatch = normalized.match(/^([OU])\s*(\d+(?:\.\d+)?)/i);

  if (sideMatch) {
    return Number(sideMatch[2]);
  }

  const overMatch = normalized.match(/over\s*(\d+(?:\.\d+)?)/i);

  if (overMatch) {
    return Number(overMatch[1]);
  }

  const underMatch = normalized.match(/under\s*(\d+(?:\.\d+)?)/i);

  if (underMatch) {
    return Number(underMatch[1]);
  }

  return undefined;
}

function parseTotalLabel(text: string): ParsedMarketSide {
  const normalized = text.trim();
  const line = parseTotalLine(normalized);

  if (line !== undefined && /^O\s*\/\s*U/i.test(normalized)) {
    return { line, label: `O/U ${line}` };
  }

  const match = normalized.match(/^([OU])\s*(\d+(?:\.\d+)?)/i);

  if (!match) {
    const overMatch = normalized.match(/over\s*(\d+(?:\.\d+)?)/i);
    if (overMatch) {
      return {
        side: "over",
        line: Number(overMatch[1]),
        label: `O${overMatch[1]}`,
      };
    }

    const underMatch = normalized.match(/under\s*(\d+(?:\.\d+)?)/i);
    if (underMatch) {
      return {
        side: "under",
        line: Number(underMatch[1]),
        label: `U${underMatch[1]}`,
      };
    }

    return { label: normalized };
  }

  const side = match[1]?.toUpperCase() === "O" ? "over" : "under";
  const matchedLine = Number(match[2]);

  return {
    side,
    line: matchedLine,
    label: `${side === "over" ? "O" : "U"}${matchedLine}`,
  };
}

function parseExactScoreLabel(groupTitle: string, question: string): string | undefined {
  const candidates = [groupTitle, question];

  for (const candidate of candidates) {
    const match = candidate.match(/(\d+)\s*[-:]\s*(\d+)/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
  }

  if (normalizeGammaSearchText(groupTitle).includes("any other")) {
    return "Other";
  }

  return undefined;
}

function classifyHalftimeSide(
  question: string,
  homeName: string,
  awayName: string,
): MatchOutcomeSide | undefined {
  const normalized = normalizeGammaSearchText(question);

  if (normalized.includes("end in a draw") || normalized.includes("ends in a draw")) {
    return "draw";
  }

  const winningTeamMatch = question.match(/If\s+(.+?)\s+wins?\s+within\s+the\s+first\s+45/i);
  if (winningTeamMatch?.[1]) {
    return classifyTeamSide(winningTeamMatch[1].trim(), homeName, awayName);
  }

  return classifyTeamSide(question, homeName, awayName);
}

function classifyTeamSide(
  label: string,
  homeName: string,
  awayName: string,
): MatchOutcomeSide | undefined {
  const normalized = normalizeGammaSearchText(label);
  const home = normalizeGammaSearchText(homeName);
  const away = normalizeGammaSearchText(awayName);

  if (["draw", "tie", "x", "d"].includes(normalized) || normalized.includes("draw")) {
    return "draw";
  }

  if (normalized === home || normalized.includes(home) || home.includes(normalized)) {
    return "home";
  }

  if (normalized === away || normalized.includes(away) || away.includes(normalized)) {
    return "away";
  }

  return undefined;
}

function buildOutcomeId(
  marketType: FixtureSportsMarketType,
  parsed: ParsedMarketSide,
  conditionId?: string,
): string {
  if (parsed.line !== undefined && parsed.side) {
    return `${marketType}:${parsed.line}:${parsed.side}`;
  }

  if (parsed.side) {
    return `${marketType}:${parsed.side}`;
  }

  if (parsed.label) {
    return `${marketType}:${normalizeGammaSearchText(parsed.label).replace(/\s+/g, "-")}`;
  }

  return `${marketType}:${conditionId ?? "unknown"}`;
}

function sortExactScores(outcomes: FixtureMarketOutcome[]): FixtureMarketOutcome[] {
  return [...outcomes].sort((left, right) => {
    if (left.label === "Other") {
      return 1;
    }

    if (right.label === "Other") {
      return -1;
    }

    const leftScore = parseScorePair(left.label);
    const rightScore = parseScorePair(right.label);

    if (!leftScore || !rightScore) {
      return left.label.localeCompare(right.label);
    }

    const leftTotal = leftScore.home + leftScore.away;
    const rightTotal = rightScore.home + rightScore.away;

    if (leftTotal !== rightTotal) {
      return leftTotal - rightTotal;
    }

    if (leftScore.home !== rightScore.home) {
      return leftScore.home - rightScore.home;
    }

    return leftScore.away - rightScore.away;
  });
}

function sortHalftimeOutcomes(
  outcomes: FixtureMarketOutcome[],
  homeName: string,
  awayName: string,
): FixtureMarketOutcome[] {
  const order: MatchOutcomeSide[] = ["home", "draw", "away"];

  return [...outcomes].sort((left, right) => {
    const leftIndex = left.side ? order.indexOf(left.side as MatchOutcomeSide) : 99;
    const rightIndex = right.side ? order.indexOf(right.side as MatchOutcomeSide) : 99;

    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }

    return left.label.localeCompare(right.label);
  });
}

function parseScorePair(label: string): { home: number; away: number } | undefined {
  const match = label.match(/^(\d+)\s*-\s*(\d+)$/);
  if (!match) {
    return undefined;
  }

  return {
    home: Number(match[1]),
    away: Number(match[2]),
  };
}

function abbreviateTeamName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= 3) {
    return trimmed.toUpperCase();
  }

  return trimmed.slice(0, 3).toUpperCase();
}

function resolveOutcomePrice(probability: number, yesAsk?: number): number {
  if (yesAsk !== undefined && Number.isFinite(yesAsk) && yesAsk > 0 && yesAsk < 1) {
    return yesAsk;
  }

  return Math.max(0.001, Math.min(0.999, probability / 100));
}

function getYesMarketOutcome(market: GammaMarketRecord): {
  tokenId?: string;
  probability: number;
  volume?: number;
  yesAsk?: number;
  yesBid?: number;
} {
  const outcomes = parseGammaArrayField(market.outcomes).map(String);
  const prices = parseGammaArrayField(market.outcomePrices);
  const tokenIds = parseGammaArrayField(market.clobTokenIds).map(String);
  const yesIndex = outcomes.findIndex((outcome) => outcome.toLowerCase() === "yes");
  const index = yesIndex >= 0 ? yesIndex : 0;
  const rawPrice = toGammaNumber(prices[index]);
  const lastTradePrice = toGammaNumber(market.lastTradePrice);

  return {
    tokenId: tokenIds[index],
    probability: priceToProbability(rawPrice ?? lastTradePrice) ?? 0,
    volume: firstGammaNumber(market.volumeNum, market.volume),
    yesAsk: rawPrice ?? lastTradePrice,
    yesBid: rawPrice ?? lastTradePrice,
  };
}

function getNoMarketOutcome(market: GammaMarketRecord): {
  tokenId?: string;
  yesAsk?: number;
  yesBid?: number;
} {
  const outcomes = parseGammaArrayField(market.outcomes).map(String);
  const prices = parseGammaArrayField(market.outcomePrices);
  const tokenIds = parseGammaArrayField(market.clobTokenIds).map(String);
  const noIndex = outcomes.findIndex((outcome) => outcome.toLowerCase() === "no");
  const index = noIndex >= 0 ? noIndex : 1;
  const rawPrice = toGammaNumber(prices[index]);

  return {
    tokenId: tokenIds[index],
    yesAsk: rawPrice,
    yesBid: rawPrice,
  };
}

export function findFixtureMarketOutcome(
  snapshot: PolymarketFixtureMarketsData | undefined,
  outcomeId: string,
): FixtureMarketOutcome | undefined {
  if (!snapshot) {
    return undefined;
  }

  for (const group of snapshot.lines) {
    const match = group.outcomes.find((item) => item.id === outcomeId);
    if (match) {
      return match;
    }
  }

  return (
    snapshot.exactScores.find((item) => item.id === outcomeId) ??
    snapshot.halftime.find((item) => item.id === outcomeId)
  );
}

export function resolveDefaultFixtureOutcome(
  snapshot: PolymarketFixtureMarketsData | undefined,
): FixtureMarketOutcome | undefined {
  if (!snapshot) {
    return undefined;
  }

  const moneyline = snapshot.lines.find((group) => group.type === "moneyline");
  return moneyline?.outcomes.find((item) => item.side === "home") ?? moneyline?.outcomes[0];
}
