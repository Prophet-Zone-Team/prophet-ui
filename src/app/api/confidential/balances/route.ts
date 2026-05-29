import { NextResponse } from "next/server";

import { resolveConfidentialBalances } from "@/server/confidential/balances";
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

    const balances = await resolveConfidentialBalances(confidentialSession);

    return NextResponse.json({
      walletAddress: confidentialSession.walletAddress,
      privateAccountAddress: confidentialSession.intentsUserId,
      balances: balances.balances,
      usdcBalance: balances.usdcBalanceBaseUnits,
      usdcBalanceFormatted: balances.usdcBalanceFormatted,
      privateBalanceUsd: balances.privateBalanceUsd,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return confidentialErrorResponse(error);
  }
}
