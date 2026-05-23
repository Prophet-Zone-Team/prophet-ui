import { NextResponse } from "next/server";

import { fetchBridgeSupportedAssets } from "../../../../../server/trading/bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({
      assets: await fetchBridgeSupportedAssets(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
