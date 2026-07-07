import { NextResponse } from "next/server";

import { isShareImageProxyUrlAllowed } from "@/lib/referral/share-image-proxy-allowlist";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url")?.trim();

  if (!targetUrl) {
    return NextResponse.json(
      { error: "Missing required query parameter: url" },
      { status: 400 },
    );
  }

  if (!isShareImageProxyUrlAllowed(targetUrl)) {
    return NextResponse.json({ error: "Image URL is not allowed." }, { status: 403 });
  }

  try {
    const upstream = await fetch(targetUrl, {
      signal: AbortSignal.timeout(8_000),
      headers: {
        Accept: "image/*",
        "User-Agent": "ProphetShareCard/1.0",
      },
      cache: "force-cache",
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream image request failed (${upstream.status}).` },
        { status: upstream.status },
      );
    }

    const contentType =
      upstream.headers.get("content-type")?.split(";")[0]?.trim() ??
      "image/png";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch upstream image." },
      { status: 502 },
    );
  }
}
