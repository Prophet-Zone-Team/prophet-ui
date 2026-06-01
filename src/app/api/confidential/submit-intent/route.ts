import { NextResponse } from "next/server";

import { buildAuthSignedData } from "@/server/confidential/auth";
import { submitConfidentialIntent } from "@/server/confidential/one-click-client";
import {
  applyRefreshedCookie,
  requireConfidentialAccess,
} from "@/server/confidential/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SubmitIntentPayload {
  message?: string;
  signature?: string;
}

export async function POST(request: Request) {
  const auth = await requireConfidentialAccess(request);

  if (!auth.ok) {
    return auth.response;
  }

  const payload = (await request.json().catch(() => ({}))) as SubmitIntentPayload;
  const message = payload.message;
  const signature = payload.signature?.trim();

  if (!message || !signature || !/^0x[a-fA-F0-9]+$/.test(signature)) {
    return NextResponse.json({ error: "A signed intent is required." }, { status: 400 });
  }

  try {
    const signedData = buildAuthSignedData(auth.access.session.eoaAddress, message, signature);
    const result = await submitConfidentialIntent(
      { type: "SWAP_TRANSFER", signedData },
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
