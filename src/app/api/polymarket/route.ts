import { NextResponse } from "next/server";

import {
  fetchPolymarketGamma,
  PolymarketGammaFetchError,
  PolymarketGammaNotFoundError,
} from "@/lib/market/polymarket-gamma-fetch";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "Missing required query parameter: path" }, { status: 400 });
  }

  if (!path.startsWith("/")) {
    return NextResponse.json({ error: "path must start with /" }, { status: 400 });
  }

  const params: Record<string, string> = {};

  for (const [key, value] of searchParams.entries()) {
    if (key === "path") {
      continue;
    }

    params[key] = value;
  }

  try {
    const payload = await fetchPolymarketGamma(path, params);
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof PolymarketGammaNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof PolymarketGammaFetchError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Polymarket proxy request failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
