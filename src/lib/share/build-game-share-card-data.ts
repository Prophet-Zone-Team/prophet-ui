import { getOutcomeProbability } from "@/lib/market/game-market-snapshot";
import {
  findGameMarketOutcome,
  resolveGameOutcomeTradePrice,
} from "@/lib/market/game-outcome-price";
function formatShareCardPrice(price: number): string {
  return `${(price * 100).toFixed(1)} \u00A2`;
}
import { resolveMatchSides } from "@/lib/market/schedule-match";
import type {
  GameMarketSnapshot,
  MatchOutcomeSide,
  WorldCupMatch,
} from "@/types/market";

export type GameShareCardTeam = {
  name: string;
  code?: string;
  logoDataUrl?: string;
};

export type GameShareCardRow = {
  outcomeLabel: string;
  chanceLabel: string;
  yesPriceLabel: string;
  noPriceLabel: string;
};

export type GameShareCardData = {
  prophetLogoDataUrl: string;
  home: GameShareCardTeam;
  away: GameShareCardTeam;
  title: string;
  timestamp: string;
  rows: GameShareCardRow[];
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatShareCardTimestamp(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatChancePercent(probability: number): string {
  return `${probability.toFixed(1)}%`;
}

function resolveOutcomeLabel(
  side: MatchOutcomeSide,
  homeCode: string | undefined,
  awayCode: string | undefined,
): string {
  if (side === "draw") {
    return "DRAW";
  }

  if (side === "home") {
    return (homeCode ?? "HOME").toUpperCase();
  }

  return (awayCode ?? "AWAY").toUpperCase();
}

function buildShareCardRow(
  snapshot: GameMarketSnapshot,
  side: MatchOutcomeSide,
  homeCode: string | undefined,
  awayCode: string | undefined,
): GameShareCardRow {
  const outcome = findGameMarketOutcome(snapshot.outcomes, side);
  const probability = getOutcomeProbability(snapshot, side);
  const yesPrice = resolveGameOutcomeTradePrice(
    outcome,
    probability,
    "yes",
    "buy",
  );
  const noPrice = resolveGameOutcomeTradePrice(
    outcome,
    probability,
    "no",
    "buy",
  );

  return {
    outcomeLabel: resolveOutcomeLabel(side, homeCode, awayCode),
    chanceLabel: formatChancePercent(probability),
    yesPriceLabel: formatShareCardPrice(yesPrice),
    noPriceLabel: formatShareCardPrice(noPrice),
  };
}

export function buildGameShareCardData(
  match: WorldCupMatch,
  gameSnapshot: GameMarketSnapshot,
  assets: {
    prophetLogoDataUrl: string;
    homeLogoDataUrl?: string;
    awayLogoDataUrl?: string;
  },
): GameShareCardData {
  const sides = resolveMatchSides(match, []);
  const homeCode = sides.home.code;
  const awayCode = sides.away.code;

  return {
    prophetLogoDataUrl: assets.prophetLogoDataUrl,
    home: {
      name: sides.home.name,
      code: homeCode,
      logoDataUrl: assets.homeLogoDataUrl,
    },
    away: {
      name: sides.away.name,
      code: awayCode,
      logoDataUrl: assets.awayLogoDataUrl,
    },
    title: `${sides.home.name} vs ${sides.away.name}`,
    timestamp: formatShareCardTimestamp(),
    rows: (["home", "draw", "away"] as const).map((side) =>
      buildShareCardRow(gameSnapshot, side, homeCode, awayCode),
    ),
  };
}
