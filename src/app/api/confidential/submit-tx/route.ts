import { NextResponse } from "next/server";

import { submitConfidentialDepositTx } from "@/server/confidential/one-click-client";
import {
  applyRefreshedCookie,
  requireConfidentialAccess,
} from "@/server/confidential/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SubmitTxPayload {
  txHash?: string;
  depositAddress?: string;
  memo?: string;
}

export async function POST(request: Request) {
  const auth = await requireConfidentialAccess(request);

  if (!auth.ok) {
    return auth.response;
  }

  const payload = (await request.json().catch(() => ({}))) as SubmitTxPayload;
  const txHash = payload.txHash?.trim();
  const depositAddress = payload.depositAddress?.trim();

  if (!txHash || !/^0x[a-fA-F0-9]+$/.test(txHash)) {
    return NextResponse.json({ error: "A valid txHash is required." }, { status: 400 });
  }

  if (!depositAddress) {
    return NextResponse.json({ error: "depositAddress is required." }, { status: 400 });
  }

  try {
    const result = await submitConfidentialDepositTx(
      { txHash, depositAddress, memo: payload.memo?.trim() || undefined },
      auth.access.accessToken,
    );

    return applyRefreshedCookie(
      NextResponse.json({ status: result.status ?? "OK" }),
      auth.access,
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}
