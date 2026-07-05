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
  73: "canada", // R32: South Africa vs Canada — Canada advances (feeds W73 → R16 M90)
  74: "paraguay", // R32: Germany vs Paraguay — Paraguay advances (feeds W74 → R16 M89)
  75: "morocco", // R32: Netherlands vs Morocco — Morocco advances (feeds W75 → R16 M90)
  76: "brazil", // R32: Brazil vs Japan — Brazil advances (feeds W76 → R16 M91)
  77: "france", // R32: France vs Sweden — France advances (feeds W77 → R16 M89)
  78: "norway", // R32: Côte d'Ivoire vs Norway — Norway advances (feeds W78 → R16 M91)
  79: "mexico", // R32: Mexico vs Ecuador — Mexico advances (feeds W79 → R16 M92)
  80: "england", // R32: England vs Congo DR — England advances (feeds W80 → R16 M92)
  81: "usa", // R32: USA vs Bosnia and Herzegovina — USA advances (feeds W81 → R16 M94)
  82: "belgium", // R32: Belgium vs Senegal — Belgium advances (feeds W82 → R16 M94)
  83: "portugal", // R32: Portugal vs Croatia — Portugal advances (feeds W83 → R16 M93)
  84: "spain", // R32: Spain vs Austria — Spain advances (feeds W84 → R16 M93)
  85: "switzerland", // R32: Switzerland vs Algeria — Switzerland advances (feeds W85 → R16 M96)
  86: "argentina", // R32: Argentina vs Cape Verde — Argentina advances (feeds W86 → R16 M95)
  87: "colombia", // R32: Colombia vs Ghana — Colombia advances (feeds W87 → R16 M96)
  88: "egypt", // R32: Australia vs Egypt — Egypt advances (feeds W88 → R16 M95)
  89: "france", // R16: Paraguay vs France — France advances (feeds W89 → QF M97)
  90: "morocco", // R16: Canada vs Morocco — Morocco advances (feeds W90 → QF M97)
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
