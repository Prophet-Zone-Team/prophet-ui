import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ZETTA_API_BASE_URL =
  process.env.ZETTA_API_URL?.trim() ||
  process.env.NEXT_PUBLIC_ZETTA_API_URL?.trim() ||
  "https://zetta.prophet.zone";

export async function GET(request: NextRequest) {
  const eventSlug = request.nextUrl.searchParams.get("event")?.trim();

  if (!eventSlug) {
    return NextResponse.json(
      { error: "Missing required query parameter: event" },
      { status: 400 }
    );
  }

  const upstreamUrl = new URL(
    "/api/events/smart-wallets",
    ZETTA_API_BASE_URL
  );
  upstreamUrl.searchParams.set("event", eventSlug);

  try {
    const response = await fetch(upstreamUrl.toString(), {
      cache: "no-store"
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({
        error: "Unable to load smart wallet data."
      }));

      return NextResponse.json(payload, { status: response.status });
    }

    const payload = await response.json();
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { error: "Unable to reach Zetta smart wallet service." },
      { status: 502 }
    );
  }
}
