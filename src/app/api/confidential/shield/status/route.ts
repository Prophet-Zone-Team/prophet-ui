import { NextResponse } from "next/server";

import { getConfidentialExecutionStatus } from "@/server/confidential/operations";
import {
  confidentialErrorResponse,
  requireConfidentialSession,
  requireTradingWalletSession,
} from "@/server/confidential/route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const tradingSession = requireTradingWalletSession(request);

    if (tradingSession instanceof NextResponse) {
      return tradingSession;
    }

    const confidentialSession = await requireConfidentialSession(
      request,
      tradingSession.walletAddress,
    );

    if (confidentialSession instanceof NextResponse) {
      return confidentialSession;
    }

    const url = new URL(request.url);
    const depositAddress = url.searchParams.get("depositAddress")?.trim();
    const depositMemo = url.searchParams.get("depositMemo")?.trim() || undefined;

    if (!depositAddress) {
      return NextResponse.json({ error: "depositAddress is required." }, { status: 400 });
    }

    const status = await getConfidentialExecutionStatus(
      confidentialSession,
      depositAddress,
      depositMemo,
    );

    return NextResponse.json({
      status,
      depositAddress,
    });
  } catch (error) {
    return confidentialErrorResponse(error);
  }
}
