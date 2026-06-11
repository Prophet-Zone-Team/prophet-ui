import {
  resolveAmountBucket,
  resolvePriceBucket,
  resolveSizeBucket
} from "./buckets";
import { trackAnalyticsEvent } from "./track";

type TradeAnalyticsFields = {
  marketId?: string;
  outcomeId?: string;
  teamId?: string;
  teamName?: string;
  teamCode?: string;
  side?: string;
  price?: string | number;
  amount?: string | number;
  size?: string | number;
  eligibilityStatus?: string;
  walletType?: string;
  orderStatus?: string;
  failureReason?: string;
  errorCode?: string;
  stalePrice?: boolean;
  changedField?: string;
  entrySource?: string;
};

function buildTradeFields(
  input: TradeAnalyticsFields
): Record<string, string | number | boolean | undefined> {
  return {
    marketId: input.marketId,
    outcomeId: input.outcomeId,
    teamId: input.teamId,
    teamName: input.teamName,
    teamCode: input.teamCode,
    side: input.side,
    priceBucket: resolvePriceBucket(input.price),
    amountBucket: resolveAmountBucket(input.amount),
    sizeBucket: resolveSizeBucket(input.size),
    eligibilityStatus: input.eligibilityStatus,
    walletType: input.walletType,
    orderStatus: input.orderStatus,
    failureReason: input.failureReason,
    errorCode: input.errorCode,
    stalePrice: input.stalePrice,
    changedField: input.changedField,
    entrySource: input.entrySource
  };
}

export function trackEligibilityCheckCompleted(
  input: TradeAnalyticsFields
): void {
  trackAnalyticsEvent({
    eventName: "eligibility_check_completed",
    ...buildTradeFields(input)
  });
}

export function trackOrderTicketOpened(input: TradeAnalyticsFields): void {
  trackAnalyticsEvent({
    eventName: "order_ticket_opened",
    ...buildTradeFields(input)
  });
}

function parseTradeNumericValue(value: string | number | undefined): number {
  if (value === undefined || value === "") {
    return 0;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveOrderInputChangedValue(input: TradeAnalyticsFields): number {
  switch (input.changedField) {
    case "amount":
      return parseTradeNumericValue(input.amount);
    case "price":
      return parseTradeNumericValue(input.price);
    case "size":
      return parseTradeNumericValue(input.size);
    default:
      return parseTradeNumericValue(input.amount ?? input.price ?? input.size);
  }
}

export function trackOrderInputChanged(input: TradeAnalyticsFields): void {
  if (resolveOrderInputChangedValue(input) === 0) {
    return;
  }

  trackAnalyticsEvent({
    eventName: "order_input_changed",
    ...buildTradeFields(input)
  });
}

export function trackOrderPreviewRequested(input: TradeAnalyticsFields): void {
  trackAnalyticsEvent({
    eventName: "order_preview_requested",
    ...buildTradeFields(input)
  });
}

export function trackOrderPreviewCompleted(input: TradeAnalyticsFields): void {
  trackAnalyticsEvent({
    eventName: "order_preview_completed",
    ...buildTradeFields(input)
  });
}

export function trackOrderConfirmClicked(input: TradeAnalyticsFields): void {
  trackAnalyticsEvent({
    eventName: "order_confirm_clicked",
    ...buildTradeFields(input)
  });
}

export function trackOrderSubmitStarted(input: TradeAnalyticsFields): void {
  trackAnalyticsEvent({
    eventName: "order_submit_started",
    ...buildTradeFields(input)
  });
}

export function trackOrderSubmitSucceeded(input: TradeAnalyticsFields): void {
  trackAnalyticsEvent({
    eventName: "order_submit_succeeded",
    ...buildTradeFields(input)
  });
}

export function trackOrderSubmitFailed(input: TradeAnalyticsFields): void {
  trackAnalyticsEvent({
    eventName: "order_submit_failed",
    ...buildTradeFields(input)
  });
}

export function trackPortfolioViewed(): void {
  trackAnalyticsEvent({
    eventName: "portfolio_viewed"
  });
}

export function trackTrackPageViewed(): void {
  trackAnalyticsEvent({
    eventName: "track_page_viewed"
  });
}

export function trackTrackedTeamRevisited(input: {
  teamId?: string;
  teamName?: string;
  teamCode?: string;
  entrySource?: string;
}): void {
  trackAnalyticsEvent({
    eventName: "tracked_team_revisited",
    teamId: input.teamId,
    teamName: input.teamName,
    teamCode: input.teamCode,
    entrySource: input.entrySource
  });
}

export function trackShareClicked(input: {
  target?: string;
  label?: string;
  entrySource?: string;
}): void {
  trackAnalyticsEvent({
    eventName: "share_clicked",
    target: input.target,
    label: input.label,
    entrySource: input.entrySource
  });
}

export function trackCopyLinkClicked(input: {
  target?: string;
  label?: string;
  entrySource?: string;
}): void {
  trackAnalyticsEvent({
    eventName: "copy_link_clicked",
    target: input.target,
    label: input.label,
    entrySource: input.entrySource
  });
}
