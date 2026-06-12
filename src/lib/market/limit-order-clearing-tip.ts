import { formatDateTimeFromIso } from "@/lib/formatters/datetime";

const GMT8_TIMEZONE = "Asia/Shanghai";

export function formatOrderBookClearingKickoff(
  kickoffAt: string,
  _locale = "en-US"
): string {
  return formatDateTimeFromIso(kickoffAt, GMT8_TIMEZONE);
}

export function formatOrderBookClearingTip(kickoffAt: string): string {
  return `Order book clears at ${formatOrderBookClearingKickoff(kickoffAt)} GMT+8`;
}

export function formatOrderBookClearingTooltip(kickoffAt: string): string {
  const kickoffLabel = formatOrderBookClearingKickoff(kickoffAt);

  return `All unfilled limit orders in this market will be canceled when the match starts on ${kickoffLabel} GMT+8. You can place orders again after the match starts.`;
}
