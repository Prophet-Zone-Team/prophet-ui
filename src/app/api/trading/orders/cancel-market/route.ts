import { NextResponse } from "next/server";

import { cancelUserMarketOrders } from "@/server/trading/clob-user-client";
import {
  getClientGeoFromRequest,
  refreshSessionEligibility
} from "@/server/trading/eligibility";
import { assertEligibilityForCancel } from "@/server/trading/eligibility-order-guard";
import {
  recordUserOrderCancelError,
  recordUserOrderCancelled
} from "@/server/trading/order-store";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CancelMarketOrdersPayload {
  market?: string;
}

export async function POST(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json(
      { error: "Trading session not found." },
      { status: 401 }
    );
  }

  if (!record.credentials) {
    return NextResponse.json(
      {
        error:
          "User CLOB credentials are required before order cancellation."
      },
      { status: 409 }
    );
  }

  const eligibility = await refreshSessionEligibility(
    record.session,
    getClientGeoFromRequest(request)
  );

  const cancelEligibility = assertEligibilityForCancel(eligibility);

  if (!cancelEligibility.ok) {
    return NextResponse.json(
      {
        error: cancelEligibility.reason,
        eligibilityStatus: cancelEligibility.status
      },
      { status: 403 }
    );
  }

  const payload = (await request.json()) as CancelMarketOrdersPayload;
  const validationError = validatePayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const market = payload.market ?? "";

  try {
    const result = await cancelUserMarketOrders({
      address: record.session.walletAddress,
      credentials: record.credentials,
      market
    });
    const cancelledAt = new Date().toISOString();
    const canceled = result.canceled ?? [];
    const notCanceled = result.not_canceled ?? {};

    await Promise.all(
      canceled.map((clobOrderId) =>
        recordUserOrderCancelled({
          session: record.session,
          clobOrderId,
          response: result,
          cancelledAt
        })
      )
    );

    await Promise.all(
      Object.entries(notCanceled).map(([clobOrderId, error]) =>
        recordUserOrderCancelError({
          session: record.session,
          clobOrderId,
          error
        })
      )
    );

    return NextResponse.json({
      canceled,
      not_canceled: notCanceled,
      cancelledAt
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 502 }
    );
  }
}

function validatePayload(
  payload: CancelMarketOrdersPayload
): string | undefined {
  if (!payload.market || typeof payload.market !== "string") {
    return "Missing market.";
  }

  return undefined;
}
