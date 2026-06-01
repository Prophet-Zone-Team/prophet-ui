import { NextResponse } from "next/server";

import { createVerificationMessage } from "@/server/confidential/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChallengePayload {
  eoaAddress?: string;
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as ChallengePayload;
  const eoaAddress = payload.eoaAddress?.trim();

  if (!eoaAddress || !/^0x[a-fA-F0-9]{40}$/.test(eoaAddress)) {
    return NextResponse.json({ error: "A valid EOA wallet address is required." }, { status: 400 });
  }

  try {
    const { message, intentsUserId } = await createVerificationMessage(eoaAddress);
    return NextResponse.json({ message, intentsUserId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}
