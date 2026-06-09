import { NextResponse } from "next/server";

import {
  filterUserPnlToYtd,
  mapPortfolioRangeToPnlParams,
  mapUserPnlToSeries
} from "@/lib/portfolio/fetch-user-pnl";
import { fetchUserPnlFromUpstream } from "@/server/portfolio/user-pnl-upstream";
import type { PortfolioTimeRange } from "@/lib/portfolio/types";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_RANGES: PortfolioTimeRange[] = [
  "1H",
  "1D",
  "1W",
  "1M",
  "YTD",
  "All"
];

function parseRange(value: string | null): PortfolioTimeRange | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();

  return VALID_RANGES.find((range) => range.toUpperCase() === normalized);
}

export async function GET(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  const userAddress =
    record.session.funderAddress ?? record.session.walletAddress;

  if (!userAddress) {
    return NextResponse.json(
      { error: "Trading session is missing a Polymarket address." },
      { status: 409 }
    );
  }

  const url = new URL(request.url);
  const range =
    parseRange(url.searchParams.get("range")) ??
    parseRangeFromQuery(url.searchParams);

  if (!range) {
    return NextResponse.json(
      {
        error: "Invalid or missing range. Expected 1H, 1D, 1W, 1M, YTD, or All."
      },
      { status: 400 }
    );
  }

  try {
    let points = await fetchUserPnlFromUpstream(userAddress, range);

    if (range === "YTD") {
      points = filterUserPnlToYtd(points);
    }

    return NextResponse.json(mapUserPnlToSeries(points, range));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 502 }
    );
  }
}

function parseRangeFromQuery(params: URLSearchParams): PortfolioTimeRange | undefined {
  const interval = params.get("interval")?.toLowerCase();
  const fidelity = params.get("fidelity")?.toLowerCase();

  if (!interval) {
    return undefined;
  }

  for (const range of VALID_RANGES) {
    const mapped = mapPortfolioRangeToPnlParams(range);

    if (
      mapped.interval === interval &&
      (!fidelity || mapped.fidelity === fidelity)
    ) {
      return range;
    }
  }

  return undefined;
}
