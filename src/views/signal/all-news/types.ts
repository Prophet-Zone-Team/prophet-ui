import type { NewsImpactItem } from "@/views/analytics/news/types";

export type SignalAllNewsItem = NewsImpactItem & {
  /** Lower values are more recent; used for Team & Time sorting. */
  publishedAtOrder: number;
};

export type SignalAllTeamFilter = "all" | string;

export type SignalAllSortColumn = "teamTime" | "impact";

export type SignalAllSortDirection = "asc" | "desc";

export type SignalAllSortState = {
  column: SignalAllSortColumn;
  direction: SignalAllSortDirection;
};

/** `value` and `label` are team `name` from curated teams data; `teamCode` is for TeamFlag display only. */
export type SignalAllTeamOption = {
  value: SignalAllTeamFilter;
  label: string;
  teamCode?: string;
};
