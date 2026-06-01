import { NextResponse } from "next/server";

import { EVM_INTENT_STANDARD } from "@/server/confidential/auth";
import {
  generateConfidentialIntent,
  type ConfidentialMultiPayload,
} from "@/server/confidential/one-click-client";
import {
  applyRefreshedCookie,
  requireConfidentialAccess,
} from "@/server/confidential/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GenerateIntentPayload {
  depositAddress?: string;
}

export async function POST(request: Request) {
  const auth = await requireConfidentialAccess(request);

  if (!auth.ok) {
    return auth.response;
  }

  const payload = (await request.json().catch(() => ({}))) as GenerateIntentPayload;
  const depositAddress = payload.depositAddress?.trim();

  if (!depositAddress) {
    return NextResponse.json({ error: "depositAddress is required." }, { status: 400 });
  }

  try {
    const result = await generateConfidentialIntent(
      {
        type: "SWAP_TRANSFER",
        standard: EVM_INTENT_STANDARD,
        depositAddress,
        signerId: auth.access.session.intentsUserId,
      },
      auth.access.accessToken,
    );

    const message = extractErc191Message(result.intent);

    if (!message) {
      return NextResponse.json(
        { error: "Generated intent did not include a signable message." },
        { status: 502 },
      );
    }

    return applyRefreshedCookie(
      NextResponse.json({ message, depositAddress }),
      auth.access,
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}

function extractErc191Message(intent: ConfidentialMultiPayload): string | undefined {
  const payload = intent.payload as unknown;

  if (typeof payload === "string") {
    return payload;
  }

  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;

    if (typeof message === "string") {
      return message;
    }
  }

  return undefined;
}
