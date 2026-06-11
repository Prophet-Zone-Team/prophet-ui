import { formatDate, formatDateTimeFromIso } from "@/lib/formatters/datetime";

export function formatRelativeTime(iso: string | undefined): string {
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
    return formatDate(published);
  }

  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return "Just Now";
  }

  if (diffMinutes < 60) {
    return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  }

  return formatDate(published);
}

export function publishedAtToOrder(iso: string | undefined): number {
  if (!iso) {
    return 0;
  }

  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function formatDateMonthAndTime(iso: string | undefined): string {
  return formatDateTimeFromIso(iso);
}
