import { formatDateFromUnixSeconds } from "@/lib/formatters/datetime";
import type { PortfolioSeriesPoint, PortfolioTimeRange } from "@/lib/portfolio/types";
import type {
  CopyPnLPoint,
  CopyPnLPointsResponse,
  CopyPnLRange,
} from "@/types/copy-trade-api";

export type CopyPnLDisplayRange = Extract<
  PortfolioTimeRange,
  "1D" | "1W" | "1M" | "YTD" | "All"
>;

export const COPY_PNL_DISPLAY_RANGES: readonly CopyPnLDisplayRange[] = [
  "1D",
  "1W",
  "1M",
  "YTD",
  "All",
];

export const COPY_PNL_RANGE_BY_DISPLAY: Record<
  CopyPnLDisplayRange,
  CopyPnLRange
> = {
  "1D": "24H",
  "1W": "7D",
  "1M": "30D",
  YTD: "1Year",
  All: "Total",
};

export function mapCopyPnLPointsToSeries(
  points: CopyPnLPoint[]
): PortfolioSeriesPoint[] {
  if (!Array.isArray(points)) {
    return [];
  }

  return points
    .filter((point) => Number.isFinite(point.t) && Number.isFinite(point.p))
    .slice()
    .sort((left, right) => left.t - right.t)
    .map((point) => ({
      date: formatDateFromUnixSeconds(point.t),
      value: point.p,
      timestamp: point.t,
    }));
}

export function selectCopyPnLSeries(
  response: CopyPnLPointsResponse | null | undefined,
  range: CopyPnLRange
): PortfolioSeriesPoint[] {
  if (!response) {
    return [];
  }

  return mapCopyPnLPointsToSeries(response[range] ?? []);
}

export function selectCopyPnLSeriesByDisplay(
  response: CopyPnLPointsResponse | null | undefined,
  displayRange: CopyPnLDisplayRange
): PortfolioSeriesPoint[] {
  return selectCopyPnLSeries(response, COPY_PNL_RANGE_BY_DISPLAY[displayRange]);
}
