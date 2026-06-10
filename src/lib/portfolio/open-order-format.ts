import { formatShareSize } from "@/lib/market/order-math";
import {
  formatPortfolioDateTime,
  formatSharePrice,
  titleCase
} from "@/lib/portfolio/portfolio-format";
import type { UserOpenOrder } from "@/lib/portfolio/types";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";

function parseOrderNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatOpenOrderFilled(order: UserOpenOrder): string {
  const matched = parseOrderNumber(order.size_matched);
  const original = parseOrderNumber(order.original_size);

  return `${formatShareSize(matched)} / ${formatShareSize(original)}`;
}

export function formatOpenOrderTotal(order: UserOpenOrder): string {
  const price = parseOrderNumber(order.price);
  const original = parseOrderNumber(order.original_size);

  if (original <= 0) {
    return formatTeamDetailMoney(0);
  }

  return formatTeamDetailMoney(price * original);
}

export function formatOpenOrderExpiration(order: UserOpenOrder): string {
  const expiration = order.expiration?.trim();

  if (!expiration || expiration === "0") {
    return "Until cancelled";
  }

  const expirationSeconds = Number(expiration);

  if (!Number.isFinite(expirationSeconds) || expirationSeconds <= 0) {
    return "Until cancelled";
  }

  return formatPortfolioDateTime(
    new Date(expirationSeconds * 1000).toISOString()
  );
}

export function formatOpenOrderPriceLabel(order: UserOpenOrder): string {
  const price = Number(order.price);

  return Number.isFinite(price) ? formatSharePrice(price) : order.price;
}

export function formatOpenOrderSideOutcomeLabel(order: UserOpenOrder): string {
  const sideLabel = titleCase(order.side);
  const outcomeLabel = titleCase(order.outcome || "—");

  return `${sideLabel} ${outcomeLabel}`;
}
