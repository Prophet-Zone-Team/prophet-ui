import { NextResponse } from "next/server";

import {
  fetchUserClosedPositions,
  type UserClosedPositionsSortBy
} from "@/server/trading/clob-user-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EVM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const VALID_SORT_BY = new Set<UserClosedPositionsSortBy>([
  "REALIZEDPNL",
  "TITLE",
  "PRICE",
  "AVGPRICE",
  "TIMESTAMP"
]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const user = url.searchParams.get("user")?.trim();

  if (!user || !EVM_ADDRESS_PATTERN.test(user)) {
    return NextResponse.json(
      { error: "user must be a valid 0x-prefixed address." },
      { status: 400 }
    );
  }

  const limit = Number(url.searchParams.get("limit") ?? "5");
  const offset = Number(url.searchParams.get("offset") ?? "0");
  const sortByParam = url.searchParams.get("sortBy") ?? "TIMESTAMP";
  const sortDirectionParam = url.searchParams.get("sortDirection") ?? "DESC";

  if (!VALID_SORT_BY.has(sortByParam as UserClosedPositionsSortBy)) {
    return NextResponse.json({ error: "Invalid sortBy." }, { status: 400 });
  }

  if (sortDirectionParam !== "ASC" && sortDirectionParam !== "DESC") {
    return NextResponse.json(
      { error: "sortDirection must be ASC or DESC." },
      { status: 400 }
    );
  }

  try {
    const positions = await fetchUserClosedPositions({
      userAddress: user,
      limit: Number.isFinite(limit) ? limit : 5,
      offset: Number.isFinite(offset) ? offset : 0,
      sortBy: sortByParam as UserClosedPositionsSortBy,
      sortDirection: sortDirectionParam
    });

    return NextResponse.json({ positions });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 502 }
    );
  }
}
