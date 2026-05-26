import type { SignalCategorySegment } from "./types";

export const SIGNAL_CATEGORY_COLORS: Record<
  SignalCategorySegment["id"],
  string
> = {
  injuries: "#FF4242",
  fitness: "#8AB956",
  suspensions: "#F4B600",
  travel: "#7A9EFF",
  morale: "#9D84FF"
};

export function formatCategoryCountWithPercent(
  count: number,
  percent: number
): string {
  const formattedPercent =
    percent % 1 === 0 ? `${percent.toFixed(0)}%` : `${percent.toFixed(1)}%`;

  return `${count} (${formattedPercent})`;
}

export function getCategoryPercentages(
  categories: Pick<SignalCategorySegment, "count">[]
): number[] {
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
