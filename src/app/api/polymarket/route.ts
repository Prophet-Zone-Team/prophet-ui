import { NextResponse } from "next/server";

import {
  fetchPolymarketGamma,
  PolymarketGammaFetchError,
  PolymarketGammaNotFoundError,
} from "@/lib/market/polymarket-gamma-fetch";
import { getTradingHost } from "@/server/trading/clob-auth";
import { serverFetch } from "@/server/trading/server-fetch";

export const dynamic = "force-dynamic";

interface PolymarketClobPostBody {
  target?: string;
  path?: string;
  body?: Record<string, unknown>;
}

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

export async function POST(request: Request) {
  let payload: PolymarketClobPostBody;

  try {
    payload = (await request.json()) as PolymarketClobPostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (payload.target !== "clob") {
    return NextResponse.json({ error: "POST requires target: \"clob\"." }, { status: 400 });
  }

  const path = payload.path?.trim();

  if (!path || !path.startsWith("/")) {
    return NextResponse.json({ error: "path must start with /" }, { status: 400 });
  }

  try {
    const response = await serverFetch(`${getTradingHost()}${path}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify(payload.body ?? {}),
    });

    const responseText = await response.text();
    const responseBody = responseText ? parseJsonBody(responseText) : null;

    if (!response.ok) {
      const message =
        typeof responseBody === "object" &&
        responseBody !== null &&
        "error" in responseBody &&
        typeof responseBody.error === "string"
          ? responseBody.error
          : `CLOB request failed (${response.status}).`;

      return NextResponse.json({ error: message }, { status: response.status });
    }

    return NextResponse.json(responseBody ?? {});
  } catch (error) {
    const message = error instanceof Error ? error.message : "CLOB proxy request failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function parseJsonBody(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return { raw: value };
  }
}
