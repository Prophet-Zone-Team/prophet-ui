import type { SignalCategoryId, SignalCategorySegment } from "./types";

const DEFAULT_CATEGORY_COLOR = "#909090";

export const SIGNAL_CATEGORY_COLORS: Record<string, string> = {
  injuries: "#FF4242",
  injury: "#FF4242",
  fitness: "#8AB956",
  form: "#8AB956",
  suspensions: "#F4B600",
  squad: "#F4B600",
  travel: "#7A9EFF",
  tactics: "#7A9EFF",
  morale: "#9D84FF"
};

export function getCategoryColor(id: SignalCategoryId): string {
  return SIGNAL_CATEGORY_COLORS[id] ?? DEFAULT_CATEGORY_COLOR;
}

export function formatCategoryCountWithPercent(
  count: number,
  percent: number
): string {
  const formattedPercent =
    percent % 1 === 0 ? `${percent.toFixed(0)}%` : `${percent.toFixed(1)}%`;

  return `${count} (${formattedPercent})`;
}

export function getCategoryPercentages(
  categories: Pick<SignalCategorySegment, "count" | "percent">[]
): number[] {
  if (categories.some((category) => typeof category.percent === "number")) {
    return categories.map((category) => category.percent ?? 0);
  }

  const total = categories.reduce((sum, category) => sum + category.count, 0);

  if (total <= 0) {
    return categories.map(() => 0);
  }

  return categories.map((category) => (category.count / total) * 100);
}

export function getCategoryTotal(
  categories: Pick<SignalCategorySegment, "count">[]
): number {
  return categories.reduce((sum, category) => sum + category.count, 0);
}
