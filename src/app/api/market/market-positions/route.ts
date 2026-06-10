import { NextResponse } from "next/server";

import { fetchMarketPositions } from "@/server/market/market-positions";

export const dynamic = "force-dynamic";

const VALID_STATUS = new Set(["OPEN", "CLOSED", "ALL"]);
const VALID_SORT_BY = new Set([
  "TOKENS",
  "CASH_PNL",
  "REALIZED_PNL",
  "TOTAL_PNL",
]);
const VALID_SORT_DIRECTION = new Set(["ASC", "DESC"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const market = url.searchParams.get("market")?.trim();
  const status = url.searchParams.get("status") ?? "OPEN";
  const sortBy = url.searchParams.get("sortBy") ?? "TOKENS";
  const sortDirection = url.searchParams.get("sortDirection") ?? "DESC";
  const limit = Number(url.searchParams.get("limit") ?? "50");
  const offset = Number(url.searchParams.get("offset") ?? "0");

  if (!market) {
    return NextResponse.json({ error: "market is required." }, { status: 400 });
  }

  if (!VALID_STATUS.has(status)) {
    return NextResponse.json(
      { error: "status must be OPEN, CLOSED, or ALL." },
      { status: 400 },
    );
  }

  if (!VALID_SORT_BY.has(sortBy)) {
    return NextResponse.json({ error: "Invalid sortBy." }, { status: 400 });
  }

  if (!VALID_SORT_DIRECTION.has(sortDirection)) {
    return NextResponse.json(
      { error: "sortDirection must be ASC or DESC." },
      { status: 400 },
    );
  }

  try {
    const positions = await fetchMarketPositions({
      conditionId: market,
      status: status as "OPEN" | "CLOSED" | "ALL",
      sortBy: sortBy as
        | "TOKENS"
        | "CASH_PNL"
        | "REALIZED_PNL"
        | "TOTAL_PNL",
      sortDirection: sortDirection as "ASC" | "DESC",
      limit: Number.isFinite(limit) ? limit : 50,
      offset: Number.isFinite(offset) ? offset : 0,
    });

    return NextResponse.json({ positions });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
