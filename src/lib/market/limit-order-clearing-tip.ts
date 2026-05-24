const GMT8_TIMEZONE = "Asia/Shanghai";

export function formatOrderBookClearingKickoff(kickoffAt: string): string {
  const date = new Date(kickoffAt);

  if (Number.isNaN(date.getTime())) {
    return kickoffAt;
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: GMT8_TIMEZONE,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

export function formatOrderBookClearingTip(kickoffAt: string): string {
  return `Order book clears at ${formatOrderBookClearingKickoff(kickoffAt)} GMT+8`;
}

export function formatOrderBookClearingTooltip(kickoffAt: string): string {
  const kickoffLabel = formatOrderBookClearingKickoff(kickoffAt);

  return `All unfilled limit orders in this market will be canceled when the match starts on ${kickoffLabel} GMT+8. You can place orders again after the match starts.`;
}
