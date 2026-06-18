import { NextResponse } from "next/server";

import { fetchComboMarketsFromRfqApi } from "@/server/combo/fetch-combo-markets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const cursor = searchParams.get("cursor") ?? undefined;
  const excludeParam = searchParams.get("exclude");

  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
  const exclude = excludeParam
    ? excludeParam
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : undefined;

  try {
    const response = await fetchComboMarketsFromRfqApi({
      limit: Number.isFinite(limit) && limit! > 0 ? limit : undefined,
      cursor,
      exclude,
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}
