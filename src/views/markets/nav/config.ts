export const MARKETS_NAV_ITEM_IDS = ["laliga"] as const;

export type MarketsNavItemId = (typeof MARKETS_NAV_ITEM_IDS)[number];

export type MarketsNavIconId = "laliga";

export interface MarketsNavItemConfig {
  id: MarketsNavItemId;
  labelKey: "laLiga";
  count: number;
  icon: MarketsNavIconId;
  league: string;
}

/** Static category list until markets nav is backed by API counts. */
export const MARKETS_NAV_ITEMS: MarketsNavItemConfig[] = [
  {
    id: "laliga",
    labelKey: "laLiga",
    count: 0,
    icon: "laliga",
    league: "laliga"
  }
];

export const DEFAULT_MARKETS_NAV_ITEM_ID: MarketsNavItemId =
  MARKETS_NAV_ITEMS[0].id;
