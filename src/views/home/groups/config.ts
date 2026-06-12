import type { GroupStandingRow } from "@/types/group-standings";

export const GROUP_STANDINGS_GRID_TEMPLATE_COLUMNS =
  "minmax(200px, 1.8fr) repeat(5, minmax(52px, 0.5fr)) minmax(100px, 0.8fr)";

export const GROUP_STANDINGS_TABLE_MIN_WIDTH = "930px";

export const GROUP_STANDING_STAT_FIELDS: {
  key: keyof Pick<
    GroupStandingRow,
    "played" | "wins" | "draws" | "losses" | "points"
  >;
  labelKey:
    | "statPlayed"
    | "statWins"
    | "statDraws"
    | "statLosses"
    | "statPoints";
}[] = [
  { key: "played", labelKey: "statPlayed" },
  { key: "wins", labelKey: "statWins" },
  { key: "draws", labelKey: "statDraws" },
  { key: "losses", labelKey: "statLosses" },
  { key: "points", labelKey: "statPoints" },
];

/** Figma sample values for Group A / B advancing probabilities. */
export const GROUP_ADVANCING_MOCK_OVERRIDES: Record<string, number> = {
  mexico: 93,
  czechia: 70,
  "south-korea": 70,
  "south-africa": 38,
  switzerland: 94,
  canada: 86,
  "bosnia-herzegovina": 66,
  qatar: 22,
};
