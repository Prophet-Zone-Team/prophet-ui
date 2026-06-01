import { NextResponse } from "next/server";

import { getConfidentialExecutionStatus } from "@/server/confidential/one-click-client";
import {
  applyRefreshedCookie,
  requireConfidentialAccess,
} from "@/server/confidential/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireConfidentialAccess(request);

  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const depositAddress = url.searchParams.get("depositAddress")?.trim();
  const depositMemo = url.searchParams.get("depositMemo")?.trim() || undefined;

  if (!depositAddress) {
    return NextResponse.json({ error: "depositAddress is required." }, { status: 400 });
  }

  try {
    const result = await getConfidentialExecutionStatus(
      depositAddress,
      depositMemo,
      auth.access.accessToken,
    );

    return applyRefreshedCookie(
      NextResponse.json({ status: result.status }),
      auth.access,
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}
