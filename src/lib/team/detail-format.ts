import { formatDate } from "@/lib/formatters/datetime";

export function formatTeamDetailMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

export function formatShortWallet(value?: string): string {
  if (!value) {
    return "";
  }

  if (value.length <= 10) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function formatUnixRelativeTime(timestampSeconds: number): string {
  const date = new Date(timestampSeconds * 1000);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = Date.now();
  const diffMs = now - date.getTime();

  if (diffMs < 0) {
    return formatDate(date);
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

  return formatDate(date);
}
