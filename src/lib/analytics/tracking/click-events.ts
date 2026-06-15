import { resolveAmountBucket, resolvePriceBucket } from "./buckets";
import { trackAnalyticsEvent } from "./track";

export function trackQuickBidClicked(input: {
  teamId?: string;
  teamName?: string;
  teamCode?: string;
  marketId?: string;
  outcomeId?: string;
  side?: string;
  price?: string | number;
  entrySource?: string;
  itemPosition?: number;
  listName?: string;
}): void {
  trackAnalyticsEvent({
    eventName: "quick_bid_clicked",
    teamId: input.teamId,
    teamName: input.teamName,
    teamCode: input.teamCode,
    marketId: input.marketId,
    outcomeId: input.outcomeId,
    side: input.side ?? "buy",
    priceBucket: resolvePriceBucket(input.price),
    entrySource: input.entrySource,
    itemPosition: input.itemPosition,
    listName: input.listName
  });
}

export function trackTeamDetailClicked(input: {
  teamId?: string;
  teamName?: string;
  teamCode?: string;
  entrySource?: string;
  itemPosition?: number;
  listName?: string;
}): void {
  trackAnalyticsEvent({
    eventName: "team_detail_clicked",
    teamId: input.teamId,
    teamName: input.teamName,
    teamCode: input.teamCode,
    entrySource: input.entrySource,
    itemPosition: input.itemPosition,
    listName: input.listName
  });
}

export function trackDetailsClicked(input: {
  teamId?: string;
  teamName?: string;
  teamCode?: string;
  entrySource?: string;
  itemPosition?: number;
  listName?: string;
  target?: string;
}): void {
  trackAnalyticsEvent({
    eventName: "details_clicked",
    teamId: input.teamId,
    teamName: input.teamName,
    teamCode: input.teamCode,
    entrySource: input.entrySource,
    itemPosition: input.itemPosition,
    listName: input.listName,
    target: input.target
  });
}

export function trackNavClicked(input: {
  target: string;
  label?: string;
}): void {
  trackAnalyticsEvent({
    eventName: "nav_clicked",
    target: input.target,
    label: input.label
  });
}
