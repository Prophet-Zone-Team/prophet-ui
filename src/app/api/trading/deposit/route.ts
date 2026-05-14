import { NextResponse } from "next/server";

import {
  createBridgeDepositAddresses,
  fetchBridgeDepositStatus,
} from "../../../../server/trading/bridge";
import { getTradingSessionFromCookie } from "../../../../server/trading/sessionStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  if (!record.session.funderAddress) {
    return NextResponse.json({ error: "Trading session is missing a deposit wallet." }, { status: 409 });
  }

  const url = new URL(request.url);
  const statusAddress = url.searchParams.get("statusAddress");

  try {
    if (statusAddress) {
      if (!/^0x[a-fA-F0-9]{40}$/.test(statusAddress)) {
        return NextResponse.json({ error: "statusAddress must be an EVM address." }, { status: 400 });
      }

      return NextResponse.json({
        status: await fetchBridgeDepositStatus(statusAddress),
      });
    }

    return NextResponse.json({
      deposit: await createBridgeDepositAddresses(record.session.funderAddress),
      funderAddress: record.session.funderAddress,
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
