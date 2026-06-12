type RelativeTimeTranslator = (
  key:
    | "justNow"
    | "oneMinuteAgo"
    | "minutesAgo"
    | "oneHourAgo"
    | "hoursAgo"
    | "oneDayAgo"
    | "daysAgo",
  values?: { count: number },
) => string;

function formatLocalizedDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatLocalizedRelativeTime(
  iso: string | undefined,
  t: RelativeTimeTranslator,
  locale: string,
): string {
  if (!iso) {
    return "";
  }

  const published = new Date(iso);

  if (Number.isNaN(published.getTime())) {
    return "";
  }

  const now = Date.now();
  const diffMs = now - published.getTime();

  if (diffMs < 0) {
    return formatLocalizedDate(published, locale);
  }

  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return t("justNow");
  }

  if (diffMinutes < 60) {
    return diffMinutes === 1
      ? t("oneMinuteAgo")
      : t("minutesAgo", { count: diffMinutes });
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return diffHours === 1
      ? t("oneHourAgo")
      : t("hoursAgo", { count: diffHours });
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return diffDays === 1
      ? t("oneDayAgo")
      : t("daysAgo", { count: diffDays });
  }

  return formatLocalizedDate(published, locale);
}
