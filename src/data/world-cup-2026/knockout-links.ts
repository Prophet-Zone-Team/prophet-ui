export interface KnockoutLinkConfig {
  matchId: number;
  left: string;
  right: string;
  stage?: "R16" | "QF" | "SF" | "FINAL" | "THIRD_PLACE";
}

export const KNOCKOUT_LINKS: KnockoutLinkConfig[] = [
  { matchId: 89, left: "W74", right: "W77", stage: "R16" },
  { matchId: 90, left: "W73", right: "W75", stage: "R16" },
  { matchId: 91, left: "W76", right: "W78", stage: "R16" },
  { matchId: 92, left: "W79", right: "W80", stage: "R16" },
  { matchId: 93, left: "W83", right: "W84", stage: "R16" },
  { matchId: 94, left: "W81", right: "W82", stage: "R16" },
  { matchId: 95, left: "W86", right: "W88", stage: "R16" },
  { matchId: 96, left: "W85", right: "W87", stage: "R16" },
  { matchId: 97, left: "W89", right: "W90", stage: "QF" },
  { matchId: 98, left: "W93", right: "W94", stage: "QF" },
  { matchId: 99, left: "W91", right: "W92", stage: "QF" },
  { matchId: 100, left: "W95", right: "W96", stage: "QF" },
  { matchId: 101, left: "W97", right: "W98", stage: "SF" },
  { matchId: 102, left: "W99", right: "W100", stage: "SF" },
  { matchId: 104, left: "W101", right: "W102", stage: "FINAL" },
  { matchId: 103, left: "L101", right: "L102", stage: "THIRD_PLACE" },
];
