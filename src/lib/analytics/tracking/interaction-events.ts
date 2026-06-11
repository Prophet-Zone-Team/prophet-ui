import { trackAnalyticsEvent } from "./track";

export function trackSectionViewed(input: {
  section: string;
  sectionIndex?: number;
  visibleRatio?: number;
  visibleMs?: number;
  impressionIndex?: number;
  dedupeKey?: string;
}): void {
  trackAnalyticsEvent({
    eventName: "section_viewed",
    section: input.section,
    sectionIndex: input.sectionIndex,
    visibleRatio: input.visibleRatio,
    visibleMs: input.visibleMs,
    impressionIndex: input.impressionIndex,
    dedupeKey: input.dedupeKey
  });
}

export function trackTeamCardImpressed(input: {
  teamId?: string;
  teamName?: string;
  teamCode?: string;
  itemPosition?: number;
  listName?: string;
  visibleRatio?: number;
  visibleMs?: number;
  dedupeKey?: string;
  impressionIndex?: number;
}): void {
  trackAnalyticsEvent({
    eventName: "team_card_impressed",
    teamId: input.teamId,
    teamName: input.teamName,
    teamCode: input.teamCode,
    itemPosition: input.itemPosition,
    listName: input.listName,
    visibleRatio: input.visibleRatio,
    visibleMs: input.visibleMs,
    dedupeKey: input.dedupeKey,
    impressionIndex: input.impressionIndex
  });
}

export function trackChartViewed(input: {
  chartId?: string;
  section?: string;
  dedupeKey?: string;
  visibleRatio?: number;
  visibleMs?: number;
  impressionIndex?: number;
}): void {
  trackAnalyticsEvent({
    eventName: "chart_viewed",
    chartId: input.chartId,
    section: input.section,
    dedupeKey: input.dedupeKey,
    visibleRatio: input.visibleRatio,
    visibleMs: input.visibleMs,
    impressionIndex: input.impressionIndex
  });
}

export function trackBidAreaViewed(input: {
  teamId?: string;
  teamName?: string;
  marketId?: string;
  dedupeKey?: string;
  visibleRatio?: number;
  visibleMs?: number;
  impressionIndex?: number;
}): void {
  trackAnalyticsEvent({
    eventName: "bid_area_viewed",
    teamId: input.teamId,
    teamName: input.teamName,
    marketId: input.marketId,
    dedupeKey: input.dedupeKey,
    visibleRatio: input.visibleRatio,
    visibleMs: input.visibleMs,
    impressionIndex: input.impressionIndex
  });
}

export function trackWinnerChartRangeChanged(input: {
  chartId?: string;
  fromRange?: string;
  toRange?: string;
  teamId?: string;
  teamName?: string;
}): void {
  trackAnalyticsEvent({
    eventName: "winner_chart_range_changed",
    chartId: input.chartId,
    fromRange: input.fromRange,
    toRange: input.toRange,
    teamId: input.teamId,
    teamName: input.teamName
  });
}

export function trackWinnerChartTeamSelected(input: {
  chartId?: string;
  seriesKey?: string;
  teamId?: string;
  teamName?: string;
  teamCode?: string;
}): void {
  trackAnalyticsEvent({
    eventName: "winner_chart_team_selected",
    chartId: input.chartId,
    seriesKey: input.seriesKey,
    teamId: input.teamId,
    teamName: input.teamName,
    teamCode: input.teamCode
  });
}

export function trackMarketTabChanged(input: {
  fromRange?: string;
  toRange?: string;
  target?: string;
  label?: string;
  section?: string;
}): void {
  trackAnalyticsEvent({
    eventName: "market_tab_changed",
    fromRange: input.fromRange,
    toRange: input.toRange,
    target: input.target,
    label: input.label,
    section: input.section
  });
}

export function trackTrackClicked(input: {
  teamId?: string;
  teamName?: string;
  teamCode?: string;
  target?: string;
  entrySource?: string;
}): void {
  trackAnalyticsEvent({
    eventName: "track_clicked",
    teamId: input.teamId,
    teamName: input.teamName,
    teamCode: input.teamCode,
    target: input.target,
    entrySource: input.entrySource
  });
}

export function trackTrackAdded(input: {
  teamId?: string;
  teamName?: string;
  teamCode?: string;
  entrySource?: string;
}): void {
  trackAnalyticsEvent({
    eventName: "track_added",
    teamId: input.teamId,
    teamName: input.teamName,
    teamCode: input.teamCode,
    entrySource: input.entrySource
  });
}

export function trackTrackRemoved(input: {
  teamId?: string;
  teamName?: string;
  teamCode?: string;
  entrySource?: string;
}): void {
  trackAnalyticsEvent({
    eventName: "track_removed",
    teamId: input.teamId,
    teamName: input.teamName,
    teamCode: input.teamCode,
    entrySource: input.entrySource
  });
}
