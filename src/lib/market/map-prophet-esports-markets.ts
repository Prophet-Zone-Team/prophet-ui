import {
  normalizeGammaSearchText,
  parseGammaArrayField,
  priceToProbability,
  toGammaNumber,
} from "@/lib/market/polymarket-gamma";
import type { ProphetPolyMarketMarket } from "@/types/prophet-api";
import type {
  EsportsDisplayGroup,
  EsportsDisplayGroupKind,
  EsportsMarketCard,
  EsportsMarketKind,
  EsportsMarketSection,
  FixtureLineOption,
  FixtureMarketOutcome,
  FixtureSportsMarketType,
  MatchOutcomeSide,
  PolymarketFixtureMoneylineOutcome,
} from "@/types/market";

type ProphetMarketInput = Pick<
  ProphetPolyMarketMarket,
  | "slug"
  | "groupItemTitle"
  | "outcomePrices"
  | "outcomes"
  | "clobTokenIds"
  | "conditionId"
  | "volume"
  | "acceptingOrders"
>;

interface ClassifiedMarket {
  market: ProphetMarketInput;
  kind: EsportsMarketKind;
  sortOrder: number;
  marketType: FixtureSportsMarketType;
  lineKey?: string;
  gameNumber?: number;
}

function parseVolume(value: string | number | undefined): number | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function abbreviateTeamName(name: string): string {
  const trimmed = name.trim();

  if (trimmed.length <= 12) {
    return trimmed;
  }

  const words = trimmed.split(/\s+/).filter(Boolean);

  if (words.length > 1) {
    return words
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("");
  }

  return trimmed.slice(0, 10);
}

function classifyTeamSide(
  label: string,
  homeName: string,
  awayName: string,
): "home" | "away" | undefined {
  const normalized = normalizeGammaSearchText(label);
  const home = normalizeGammaSearchText(homeName);
  const away = normalizeGammaSearchText(awayName);

  if (normalized === home || normalized.includes(home) || home.includes(normalized)) {
    return "home";
  }

  if (normalized === away || normalized.includes(away) || away.includes(normalized)) {
    return "away";
  }

  return undefined;
}

function resolveOutcomePrice(probability: number, rawPrice?: number): number {
  if (rawPrice !== undefined && Number.isFinite(rawPrice) && rawPrice > 0) {
    return rawPrice;
  }

  return probability / 100;
}

function buildDualTeamOutcomes(
  market: ProphetMarketInput,
  marketType: FixtureSportsMarketType,
  homeName: string,
  awayName: string,
): FixtureMarketOutcome[] {
  const prices = parseGammaArrayField(market.outcomePrices);
  const tokenIds = parseGammaArrayField(market.clobTokenIds).map(String);
  const labels = parseGammaArrayField(market.outcomes).map(String);
  const volume = parseVolume(market.volume);
  const conditionId = market.conditionId ?? market.slug ?? "unknown";

  if (tokenIds.length < 2) {
    return [];
  }

  const outcomes: FixtureMarketOutcome[] = [];

  for (let index = 0; index < 2; index += 1) {
    const tokenId = tokenIds[index];

    if (!tokenId) {
      continue;
    }

    const label = labels[index]?.trim();
    const side =
      label !== undefined
        ? classifyTeamSide(label, homeName, awayName)
        : index === 0
          ? "home"
          : "away";

    if (!side) {
      continue;
    }

    const rawPrice = toGammaNumber(prices[index]);
    const probability = priceToProbability(rawPrice) ?? 0;
    const displayLabel =
      side === "home" ? abbreviateTeamName(homeName) : abbreviateTeamName(awayName);

    outcomes.push({
      id: `${marketType}:${side}:${conditionId}`,
      marketType,
      category: "lines",
      label: displayLabel,
      side,
      probability,
      price: resolveOutcomePrice(probability, rawPrice),
      volume,
      tokenId,
      conditionId: market.conditionId,
      yesAsk: rawPrice,
      yesBid: rawPrice,
      acceptingOrders: market.acceptingOrders === true,
    });
  }

  return outcomes;
}

function buildDualOverUnderOutcomes(
  market: ProphetMarketInput,
  line: number,
  marketType: FixtureSportsMarketType = "total",
): FixtureMarketOutcome[] {
  const prices = parseGammaArrayField(market.outcomePrices);
  const tokenIds = parseGammaArrayField(market.clobTokenIds).map(String);
  const volume = parseVolume(market.volume);

  if (tokenIds.length < 2) {
    return [];
  }

  const sides = ["over", "under"] as const;
  const labels = ["Over", "Under"];

  return sides.map((side, index) => {
    const rawPrice = toGammaNumber(prices[index]);
    const probability = priceToProbability(rawPrice) ?? 0;

    return {
      id: `${marketType}:${line}:${side}`,
      marketType,
      category: "lines" as const,
      label: labels[index]!,
      side,
      line,
      probability,
      price: resolveOutcomePrice(probability, rawPrice),
      volume,
      tokenId: tokenIds[index],
      conditionId: market.conditionId,
      yesAsk: rawPrice,
      yesBid: rawPrice,
      acceptingOrders: market.acceptingOrders === true,
    };
  });
}

function buildYesNoOutcome(
  market: ProphetMarketInput,
  marketType: FixtureSportsMarketType = "esports_prop",
): FixtureMarketOutcome | undefined {
  const prices = parseGammaArrayField(market.outcomePrices);
  const tokenIds = parseGammaArrayField(market.clobTokenIds).map(String);
  const yesIndex = parseGammaArrayField(market.outcomes)
    .map(String)
    .findIndex((outcome) => outcome.toLowerCase() === "yes");
  const index = yesIndex >= 0 ? yesIndex : 0;
  const tokenId = tokenIds[index];
  const noTokenId = tokenIds[index === 0 ? 1 : 0];

  if (!tokenId) {
    return undefined;
  }

  const rawYesPrice = toGammaNumber(prices[index]);
  const rawNoPrice = toGammaNumber(prices[index === 0 ? 1 : 0]);
  const probability = priceToProbability(rawYesPrice) ?? 0;
  const conditionId = market.conditionId ?? market.slug ?? "unknown";

  return {
    id: `${marketType}:${conditionId}`,
    marketType,
    category: "lines",
    label: "Yes",
    side: "yes",
    probability,
    price: resolveOutcomePrice(probability, rawYesPrice),
    volume: parseVolume(market.volume),
    tokenId,
    noTokenId,
    conditionId: market.conditionId,
    yesAsk: rawYesPrice,
    yesBid: rawYesPrice,
    noAsk: rawNoPrice,
    noBid: rawNoPrice,
    acceptingOrders: market.acceptingOrders === true,
  };
}

function parseGameNumber(value: string): number | undefined {
  const match = value.match(/game\s*(\d+)/i);
  return match ? Number(match[1]) : undefined;
}

function parseTotalLine(value: string): number | undefined {
  const match = value.match(/o\/u\s*([\d.]+)/i);
  return match ? Number(match[1]) : undefined;
}

function parseKillTotalLine(value: string): number | undefined {
  const match = value.match(/over\/under\s*([\d.]+)/i);
  return match ? Number(match[1]) : undefined;
}

function parseHandicapLineKey(title: string): string | undefined {
  const match = title.match(/[+-]\d+(?:\.\d+)?/);
  return match?.[0];
}

function parseHandicapSlugLineKey(
  slug: string,
): { side: "home" | "away"; line: number; lineKey: string } | undefined {
  const match = slug.match(/game-handicap-(home|away)-(\d+)pt5$/i);

  if (!match) {
    return undefined;
  }

  const side = match[1]!.toLowerCase() as "home" | "away";
  const line = Number(`${match[2]}.5`);

  return {
    side,
    line,
    lineKey: `${side}:${line}`,
  };
}

function parseHandicapTitleTeams(title: string): string[] | undefined {
  const match = title.match(
    /game handicap:\s*(.+?)\s*\([+-][\d.]+\)\s*vs\s*(.+?)\s*\([+-][\d.]+\)/i,
  );

  if (!match) {
    return undefined;
  }

  return [match[1]!.trim(), match[2]!.trim()];
}

function formatHandicapLineLabel(lineKey: string): string {
  const keyMatch = lineKey.match(/^(?:home|away):([\d.]+)$/);

  if (keyMatch) {
    return keyMatch[1]!;
  }

  const numeric = Number(lineKey);

  if (Number.isFinite(numeric)) {
    return String(numeric);
  }

  const signed = lineKey.match(/[+-]?([\d.]+)/);
  return signed?.[1] ?? lineKey;
}

function buildHandicapOutcomes(
  market: ProphetMarketInput,
  homeName: string,
  awayName: string,
): FixtureMarketOutcome[] {
  const title = market.groupItemTitle?.trim() ?? "";
  const slug = market.slug?.trim() ?? "";
  const prices = parseGammaArrayField(market.outcomePrices);
  const tokenIds = parseGammaArrayField(market.clobTokenIds).map(String);
  const titleTeams = parseHandicapTitleTeams(title);
  const slugLine = parseHandicapSlugLineKey(slug);
  const volume = parseVolume(market.volume);
  const conditionId = market.conditionId ?? market.slug ?? "unknown";

  if (tokenIds.length < 2) {
    return [];
  }

  const outcomes: FixtureMarketOutcome[] = [];

  for (let index = 0; index < 2; index += 1) {
    const tokenId = tokenIds[index];

    if (!tokenId) {
      continue;
    }

    let side: "home" | "away" | undefined;

    if (slugLine) {
      const firstOutcomeSide: "home" | "away" =
        slugLine.side === "away" ? "home" : "away";
      side =
        index === 0
          ? firstOutcomeSide
          : firstOutcomeSide === "home"
            ? "away"
            : "home";
    } else {
      const label = titleTeams?.[index];
      side = label
        ? classifyTeamSide(label, homeName, awayName)
        : index === 0
          ? "home"
          : "away";
    }

    if (!side) {
      continue;
    }

    const rawPrice = toGammaNumber(prices[index]);
    const probability = priceToProbability(rawPrice) ?? 0;
    const displayLabel =
      side === "home" ? abbreviateTeamName(homeName) : abbreviateTeamName(awayName);

    outcomes.push({
      id: `esports_handicap:${side}:${conditionId}`,
      marketType: "esports_handicap",
      category: "lines",
      label: displayLabel,
      side,
      probability,
      price: resolveOutcomePrice(probability, rawPrice),
      volume,
      tokenId,
      conditionId: market.conditionId,
      yesAsk: rawPrice,
      yesBid: rawPrice,
      acceptingOrders: market.acceptingOrders === true,
    });
  }

  return outcomes;
}

function classifyEsportsMarket(
  market: ProphetMarketInput,
  fixtureSlug: string,
): ClassifiedMarket | undefined {
  const slug = market.slug?.trim() ?? "";
  const title = market.groupItemTitle?.trim() ?? "";
  const normalizedTitle = normalizeGammaSearchText(title);
  const normalizedSlug = normalizeGammaSearchText(slug);
  const combined = `${title} ${slug}`;

  if (slug === fixtureSlug || normalizedTitle === "match winner") {
    return {
      market,
      kind: "match_winner",
      sortOrder: 0,
      marketType: "esports_match_winner",
    };
  }

  if (/^game\s*\d+\s*winner$/i.test(title)) {
    const gameNumber = parseGameNumber(title) ?? 99;
    return {
      market,
      kind: "game_winner",
      sortOrder: 300 + gameNumber,
      marketType: "esports_game_winner",
      lineKey: String(gameNumber),
      gameNumber,
    };
  }

  if (
    (normalizedTitle.includes("o u") || /o\/u/i.test(title)) &&
    normalizedTitle.includes("games")
  ) {
    const line = parseTotalLine(title) ?? 0;
    return {
      market,
      kind: "series_total",
      sortOrder: 100 + line,
      marketType: "total",
      lineKey: String(line),
    };
  }

  if (
    normalizedTitle.includes("game handicap") ||
    normalizedSlug.includes("game-handicap")
  ) {
    const slugLine = parseHandicapSlugLineKey(slug);
    const titleLineKey = parseHandicapLineKey(title);
    const handicapValue = slugLine?.line ?? (titleLineKey ? Math.abs(Number(titleLineKey)) : 0);
    const sideOffset = slugLine?.side === "away" ? 40 : 0;

    return {
      market,
      kind: "game_handicap",
      sortOrder: 200 + sideOffset + handicapValue * 10,
      marketType: "esports_handicap",
      lineKey:
        slugLine?.lineKey ??
        titleLineKey ??
        String(handicapValue),
    };
  }

  if (normalizedTitle.includes("first blood") || normalizedSlug.includes("first-blood")) {
    const gameNumber = parseGameNumber(combined) ?? 1;
    return {
      market,
      kind: "first_blood",
      sortOrder: 500 + gameNumber * 10,
      marketType: "esports_prop",
      gameNumber,
      lineKey: "_default",
    };
  }

  if (
    normalizedTitle.includes("total kills") &&
    (normalizedTitle.includes("over under") || /over\/under/i.test(title))
  ) {
    const gameNumber = parseGameNumber(combined) ?? 1;
    const line = parseKillTotalLine(title) ?? 0;
    return {
      market,
      kind: "kill_total",
      sortOrder: 510 + gameNumber * 10 + line,
      marketType: "total",
      gameNumber,
      lineKey: String(line),
    };
  }

  if (
    (normalizedTitle.includes("odd even") || /odd\/even/i.test(title)) &&
    normalizedTitle.includes("kill")
  ) {
    const gameNumber = parseGameNumber(combined) ?? 1;
    return {
      market,
      kind: "odd_even_kills",
      sortOrder: 520 + gameNumber * 10,
      marketType: "esports_prop",
      gameNumber,
      lineKey: "_default",
    };
  }

  return undefined;
}

function mapClassifiedMarketToCard(
  classified: ClassifiedMarket,
  homeName: string,
  awayName: string,
): EsportsMarketCard | undefined {
  const { market, kind, sortOrder, marketType, lineKey, gameNumber } = classified;
  const title = market.groupItemTitle?.trim() ?? market.slug ?? "Market";
  const id = market.conditionId ?? market.slug ?? title;
  let outcomes: FixtureMarketOutcome[] = [];

  if (
    marketType === "esports_match_winner" ||
    marketType === "esports_game_winner"
  ) {
    outcomes = buildDualTeamOutcomes(market, marketType, homeName, awayName);
  } else if (marketType === "esports_handicap") {
    outcomes = buildHandicapOutcomes(market, homeName, awayName);
  } else if (marketType === "total" && kind === "kill_total") {
    const line = lineKey ? Number(lineKey) : 0;
    outcomes = buildDualOverUnderOutcomes(market, line, "total");
  } else if (marketType === "total") {
    const line = parseTotalLine(title) ?? (lineKey ? Number(lineKey) : 0);
    outcomes = buildDualOverUnderOutcomes(market, line, "total");
  } else {
    const outcome = buildYesNoOutcome(market, "esports_prop");
    outcomes = outcome ? [outcome] : [];
  }

  if (!outcomes.length) {
    return undefined;
  }

  return {
    id,
    title,
    volume: parseVolume(market.volume),
    marketKind: kind,
    sortOrder,
    lineKey,
    gameNumber,
    outcomes,
  };
}

export function mapProphetEsportsMarkets(
  markets: ProphetPolyMarketMarket[] | null | undefined,
  homeName: string,
  awayName: string,
  fixtureSlug: string,
): EsportsMarketCard[] {
  if (!markets?.length) {
    return [];
  }

  const cards: EsportsMarketCard[] = [];

  for (const market of markets) {
    const classified = classifyEsportsMarket(market, fixtureSlug);

    if (!classified) {
      continue;
    }

    const card = mapClassifiedMarketToCard(classified, homeName, awayName);

    if (card) {
      cards.push(card);
    }
  }

  return cards.sort((left, right) => left.sortOrder - right.sortOrder);
}

function sortLineKeys(keys: string[]): string[] {
  return [...keys].sort((left, right) => {
    const leftHandicap = left.match(/^(home|away):([\d.]+)$/);
    const rightHandicap = right.match(/^(home|away):([\d.]+)$/);

    if (leftHandicap && rightHandicap) {
      if (leftHandicap[1] !== rightHandicap[1]) {
        return leftHandicap[1] === "home" ? -1 : 1;
      }

      return Number(leftHandicap[2]) - Number(rightHandicap[2]);
    }

    const leftNum = Number(left);
    const rightNum = Number(right);

    if (Number.isFinite(leftNum) && Number.isFinite(rightNum)) {
      return leftNum - rightNum;
    }

    return left.localeCompare(right);
  });
}

function buildLineGroup(
  id: string,
  kind: EsportsDisplayGroupKind,
  titleKey: EsportsDisplayGroup["titleKey"],
  buttonMode: EsportsDisplayGroup["buttonMode"],
  cards: EsportsMarketCard[],
  formatLineLabel: (lineKey: string, card: EsportsMarketCard) => number | string,
): EsportsDisplayGroup | undefined {
  if (!cards.length) {
    return undefined;
  }

  const outcomesByLine: Record<string, FixtureMarketOutcome[]> = {};
  const lineOptions: FixtureLineOption[] = [];

  for (const card of cards) {
    const lineKey = card.lineKey ?? card.id;

    if (!outcomesByLine[lineKey]) {
      outcomesByLine[lineKey] = card.outcomes;
      lineOptions.push({
        key: lineKey,
        label: formatLineLabel(lineKey, card),
      });
    }
  }

  const sortedKeys = sortLineKeys(lineOptions.map((option) => option.key));
  const orderedOptions = sortedKeys
    .map((key) => lineOptions.find((option) => option.key === key))
    .filter((option): option is FixtureLineOption => Boolean(option));

  const volume = cards.reduce((sum, card) => sum + (card.volume ?? 0), 0);

  return {
    id,
    title: "",
    titleKey,
    kind,
    buttonMode,
    lineOptions: orderedOptions,
    outcomesByLine,
    defaultLineKey: orderedOptions[0]?.key,
    volume: volume || undefined,
  };
}

function buildYesNoGroup(
  id: string,
  kind: EsportsDisplayGroupKind,
  titleKey: EsportsDisplayGroup["titleKey"],
  card: EsportsMarketCard,
): EsportsDisplayGroup {
  return {
    id,
    title: "",
    titleKey,
    kind,
    buttonMode: "yes_no",
    lineOptions: [],
    outcomesByLine: {
      _default: card.outcomes,
    },
    defaultLineKey: "_default",
    volume: card.volume,
  };
}

function buildMoneylineGroup(card: EsportsMarketCard): EsportsDisplayGroup {
  return {
    id: "moneyline",
    title: "",
    titleKey: "esportsMoneyline",
    kind: "moneyline",
    buttonMode: "home_away",
    lineOptions: [],
    outcomesByLine: {
      _default: card.outcomes,
    },
    defaultLineKey: "_default",
    volume: card.volume,
  };
}

export function buildEsportsMarketSections(
  cards: EsportsMarketCard[],
): EsportsMarketSection[] {
  const sections: EsportsMarketSection[] = [];
  const seriesGroups: EsportsDisplayGroup[] = [];

  const matchWinner = cards.find((card) => card.marketKind === "match_winner");
  if (matchWinner) {
    seriesGroups.push(buildMoneylineGroup(matchWinner));
  }

  const gameWinnerGroup = buildLineGroup(
    "game_winner",
    "game_winner",
    "esportsGameWinner",
    "home_away",
    cards.filter((card) => card.marketKind === "game_winner"),
    (lineKey) => Number(lineKey),
  );
  if (gameWinnerGroup) {
    seriesGroups.push(gameWinnerGroup);
  }

  const handicapGroup = buildLineGroup(
    "game_handicap",
    "game_handicap",
    "esportsGameHandicap",
    "home_away",
    cards.filter((card) => card.marketKind === "game_handicap"),
    (lineKey) => formatHandicapLineLabel(lineKey),
  );
  if (handicapGroup) {
    seriesGroups.push(handicapGroup);
  }

  const totalGamesGroup = buildLineGroup(
    "total_games",
    "total_games",
    "esportsTotalGames",
    "over_under",
    cards.filter((card) => card.marketKind === "series_total"),
    (lineKey) => Number(lineKey),
  );
  if (totalGamesGroup) {
    seriesGroups.push(totalGamesGroup);
  }

  if (seriesGroups.length) {
    sections.push({
      id: "series_lines",
      titleKey: "esportsSeriesLines",
      groups: seriesGroups,
    });
  }

  const gameNumbers = [
    ...new Set(
      cards
        .map((card) => card.gameNumber)
        .filter((value): value is number => value !== undefined),
    ),
  ].sort((left, right) => left - right);

  for (const gameNumber of gameNumbers) {
    const gameCards = cards.filter((card) => card.gameNumber === gameNumber);
    const gameGroups: EsportsDisplayGroup[] = [];

    const firstBlood = gameCards.find((card) => card.marketKind === "first_blood");
    if (firstBlood) {
      gameGroups.push(
        buildYesNoGroup("first_blood", "first_blood", "esportsFirstBlood", firstBlood),
      );
    }

    const killTotalsGroup = buildLineGroup(
      `kill_totals_${gameNumber}`,
      "kill_totals",
      "esportsKillTotals",
      "over_under",
      gameCards.filter((card) => card.marketKind === "kill_total"),
      (lineKey) => Number(lineKey),
    );
    if (killTotalsGroup) {
      gameGroups.push(killTotalsGroup);
    }

    const oddEven = gameCards.find((card) => card.marketKind === "odd_even_kills");
    if (oddEven) {
      gameGroups.push(
        buildYesNoGroup(
          `odd_even_${gameNumber}`,
          "odd_even_kills",
          "esportsOddEvenKills",
          oddEven,
        ),
      );
    }

    if (gameGroups.length) {
      sections.push({
        id: `game_${gameNumber}`,
        titleKey: "esportsGameSection",
        gameNumber,
        groups: gameGroups,
      });
    }
  }

  return sections;
}

export function esportsMatchWinnerToMoneylineOutcomes(
  cards: EsportsMarketCard[] | undefined,
): PolymarketFixtureMoneylineOutcome[] {
  const card = cards?.find((item) => item.marketKind === "match_winner");

  if (!card) {
    return [];
  }

  return card.outcomes
    .filter(
      (outcome): outcome is FixtureMarketOutcome & { side: MatchOutcomeSide } =>
        outcome.side === "home" || outcome.side === "away",
    )
    .map((outcome) => ({
      side: outcome.side,
      label: outcome.label,
      tokenId: outcome.tokenId,
      noTokenId: outcome.noTokenId,
      conditionId: outcome.conditionId,
      probability: outcome.probability,
      volume: outcome.volume,
      yesAsk: outcome.yesAsk,
      yesBid: outcome.yesBid,
      noAsk: outcome.noAsk,
      noBid: outcome.noBid,
    }));
}

function findOutcomeInSections(
  sections: EsportsMarketSection[] | undefined,
  outcomeId: string,
): { group: EsportsDisplayGroup; lineKey: string; outcome: FixtureMarketOutcome } | undefined {
  if (!sections?.length) {
    return undefined;
  }

  for (const section of sections) {
    for (const group of section.groups) {
      for (const [lineKey, outcomes] of Object.entries(group.outcomesByLine)) {
        const outcome = outcomes.find((entry) => entry.id === outcomeId);

        if (outcome) {
          return { group, lineKey, outcome };
        }
      }
    }
  }

  return undefined;
}

export function resolveDefaultEsportsOutcome(
  sections: EsportsMarketSection[] | undefined,
  cards?: EsportsMarketCard[],
): FixtureMarketOutcome | undefined {
  const moneylineGroup = sections
    ?.find((section) => section.id === "series_lines")
    ?.groups.find((group) => group.kind === "moneyline");

  if (moneylineGroup) {
    const outcomes = moneylineGroup.outcomesByLine._default ?? [];
    return (
      outcomes.find((outcome) => outcome.side === "home") ?? outcomes[0]
    );
  }

  const matchWinner = cards?.find((card) => card.marketKind === "match_winner");
  return (
    matchWinner?.outcomes.find((outcome) => outcome.side === "home") ??
    matchWinner?.outcomes[0] ??
    cards?.[0]?.outcomes[0]
  );
}

export function collectEsportsFixtureOutcomes(
  sections: EsportsMarketSection[] | undefined,
  cards?: EsportsMarketCard[],
): FixtureMarketOutcome[] {
  if (sections?.length) {
    const byId = new Map<string, FixtureMarketOutcome>();

    for (const section of sections) {
      for (const group of section.groups) {
        for (const outcomes of Object.values(group.outcomesByLine)) {
          for (const outcome of outcomes) {
            if (!byId.has(outcome.id)) {
              byId.set(outcome.id, outcome);
            }
          }
        }
      }
    }

    return [...byId.values()];
  }

  if (!cards?.length) {
    return [];
  }

  return cards.flatMap((card) => card.outcomes);
}

export function resolveEsportsOutcomePair(
  outcome: FixtureMarketOutcome,
  sections: EsportsMarketSection[] | undefined,
  cards?: EsportsMarketCard[],
): { yesOutcome: FixtureMarketOutcome; noOutcome: FixtureMarketOutcome } | undefined {
  const located = findOutcomeInSections(sections, outcome.id);

  if (located) {
    const outcomes = located.group.outcomesByLine[located.lineKey] ?? [];

    if (outcomes.length < 2) {
      if (located.group.buttonMode === "yes_no" && outcomes.length === 1) {
        return undefined;
      }
    }

    const homeOutcome = outcomes.find((entry) => entry.side === "home");
    const awayOutcome = outcomes.find((entry) => entry.side === "away");

    if (homeOutcome && awayOutcome) {
      return { yesOutcome: homeOutcome, noOutcome: awayOutcome };
    }

    const overOutcome = outcomes.find((entry) => entry.side === "over");
    const underOutcome = outcomes.find((entry) => entry.side === "under");

    if (overOutcome && underOutcome) {
      return { yesOutcome: overOutcome, noOutcome: underOutcome };
    }
  }

  if (!cards?.length) {
    return undefined;
  }

  const card = cards.find((item) =>
    item.outcomes.some((entry) => entry.id === outcome.id),
  );

  if (!card || card.outcomes.length < 2) {
    return undefined;
  }

  const homeOutcome = card.outcomes.find((entry) => entry.side === "home");
  const awayOutcome = card.outcomes.find((entry) => entry.side === "away");

  if (homeOutcome && awayOutcome) {
    return { yesOutcome: homeOutcome, noOutcome: awayOutcome };
  }

  const overOutcome = card.outcomes.find((entry) => entry.side === "over");
  const underOutcome = card.outcomes.find((entry) => entry.side === "under");

  if (overOutcome && underOutcome) {
    return { yesOutcome: overOutcome, noOutcome: underOutcome };
  }

  return undefined;
}
