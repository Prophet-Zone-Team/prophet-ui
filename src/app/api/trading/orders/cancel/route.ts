import { NextResponse } from "next/server";

import { cancelUserOrder } from "../../../../../server/trading/clobUserClient";
import { refreshSessionEligibility } from "../../../../../server/trading/eligibility";
import { recordUserOrderCancelError, recordUserOrderCancelled } from "../../../../../server/trading/orderStore";
import { getTradingSessionFromCookie } from "../../../../../server/trading/sessionStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CancelOrderPayload {
  orderId?: string;
}

export async function POST(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  if (!record.credentials) {
    return NextResponse.json({ error: "User CLOB credentials are required before order cancellation." }, { status: 409 });
  }

  const eligibility = await refreshSessionEligibility(record.session);

  if (eligibility.eligibilityStatus !== "eligible") {
    return NextResponse.json(
      {
        error: eligibility.eligibilityReason ?? "Trading is not enabled for this session.",
        eligibilityStatus: eligibility.eligibilityStatus,
      },
      { status: 403 },
    );
  }

  const payload = (await request.json()) as CancelOrderPayload;
  const validationError = validatePayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const result = await cancelUserOrder({
      address: record.session.walletAddress,
      credentials: record.credentials,
      orderId: payload.orderId ?? "",
    });
    const cancelledAt = new Date().toISOString();
    const order = await recordUserOrderCancelled({
      session: record.session,
      clobOrderId: payload.orderId ?? "",
      response: result,
      cancelledAt,
    });

    return NextResponse.json({
      response: result,
      order,
      cancelledAt,
    });
  } catch (error) {
    await recordUserOrderCancelError({
      session: record.session,
      clobOrderId: payload.orderId ?? "",
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}

function validatePayload(payload: CancelOrderPayload): string | undefined {
  if (!payload.orderId || typeof payload.orderId !== "string") {
    return "Missing orderId.";
  }

  return undefined;
}
