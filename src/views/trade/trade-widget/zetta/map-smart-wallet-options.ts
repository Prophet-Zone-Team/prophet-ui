import { parseTeamsFromTitle } from "@/lib/market/prophet-game-mapper";
import type { MatchOutcomeSide } from "@/types/market";

import type { ZettaSmartWalletOption } from "./types";

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

export function resolveZettaEventTeamNames(
  eventTitle: string | undefined,
  fallbackHomeTeamName: string,
  fallbackAwayTeamName: string
): { homeTeamName: string; awayTeamName: string } {
  const parsed = parseTeamsFromTitle(eventTitle ?? "");

  return {
    homeTeamName: parsed.homeName ?? fallbackHomeTeamName,
    awayTeamName: parsed.awayName ?? fallbackAwayTeamName
  };
}

export function classifySmartWalletOptionSide(
  marketQuestion: string,
  homeTeamName: string,
  awayTeamName: string
): MatchOutcomeSide | null {
  const question = normalizeText(marketQuestion);

  if (question.includes("draw")) {
    return "draw";
  }

  const home = normalizeText(homeTeamName);
  const away = normalizeText(awayTeamName);

  if (away && question.includes(away)) {
    return "away";
  }

  if (home && question.includes(home)) {
    return "home";
  }

  return null;
}

export function mapSmartWalletOptionsBySide(
  options: ZettaSmartWalletOption[],
  homeTeamName: string,
  awayTeamName: string
): Partial<Record<MatchOutcomeSide, ZettaSmartWalletOption>> {
  const mapped: Partial<Record<MatchOutcomeSide, ZettaSmartWalletOption>> = {};

  for (const option of options) {
    const side = classifySmartWalletOptionSide(
      option.market_question,
      homeTeamName,
      awayTeamName
    );

    if (side) {
      mapped[side] = option;
    }
  }

  return mapped;
}
