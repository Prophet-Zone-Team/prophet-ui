import type { KnockoutWinners } from "../types";

/**
 * Confirmed knockout match results for the Road to Final simulator.
 *
 * HOW TO UPDATE when new real-world results are known:
 * 1. Add the completed match to CONFIRMED_KNOCKOUT_WINNERS as { matchId: "team-id" }.
 * 2. Bump ROAD_TO_FINAL_BRACKET_VERSION in fixed-group-stage.ts so persisted picks reset.
 * 3. Update or add tests in fixed-knockout.test.ts (and related shortcut/url tests).
 *
 * Match ID reference:
 * - R32: 73–88
 * - R16: 89–96
 * - QF: 97–100
 * - SF: 101–102
 * - FINAL: 104
 */
export const CONFIRMED_KNOCKOUT_WINNERS: KnockoutWinners = {
  74: "paraguay", // R32: Germany vs Paraguay — Paraguay advances (feeds W74 → R16 M89)
  76: "brazil", // R32: Brazil vs Japan — Brazil advances (feeds W76 → R16 M91)
};

export const FIXED_KNOCKOUT_WINNERS: KnockoutWinners = CONFIRMED_KNOCKOUT_WINNERS;

export const FIXED_KNOCKOUT_MATCH_IDS: ReadonlySet<number> = new Set(
  Object.keys(CONFIRMED_KNOCKOUT_WINNERS).map(Number)
);

export function isFixedKnockoutMatch(matchId: number): boolean {
  return FIXED_KNOCKOUT_MATCH_IDS.has(matchId);
}

export function mergeWithFixedKnockoutWinners(
  winners: KnockoutWinners
): KnockoutWinners {
  return { ...winners, ...FIXED_KNOCKOUT_WINNERS };
}

export function getFixedKnockoutWinners(): KnockoutWinners {
  return { ...FIXED_KNOCKOUT_WINNERS };
}
