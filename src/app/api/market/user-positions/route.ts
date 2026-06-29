import { NextResponse } from "next/server";

import { fetchUserPositions } from "@/server/trading/clob-user-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EVM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

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
  const sizeThresholdParam = url.searchParams.get("sizeThreshold");
  const sizeThreshold =
    sizeThresholdParam !== null && sizeThresholdParam !== ""
      ? sizeThresholdParam
      : "0";

  try {
    const positions = await fetchUserPositions({
      userAddress: user,
      limit: Number.isFinite(limit) ? limit : 5,
      offset: Number.isFinite(offset) && offset > 0 ? offset : undefined,
      sizeThreshold
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
