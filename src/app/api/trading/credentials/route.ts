import { NextResponse } from "next/server";

import {
  deriveUserClobCredentials,
  getFreshClobAuthTypedData,
  recoverClobAuthSignerAddress,
} from "../../../../server/trading/clobAuth";
import { recordTradingAuditEvent } from "../../../../server/trading/orderStore";
import {
  createTradingCredentialsCookie,
  getTradingSessionFromCookie,
  setTradingCredentials,
} from "../../../../server/trading/sessionStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CredentialPayload {
  mode?: "challenge" | "derive";
  signature?: string;
  timestamp?: string;
  nonce?: string;
}

export async function GET(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  return NextResponse.json({
    challenge: await getFreshClobAuthTypedData({
      walletAddress: record.session.walletAddress,
    }),
  });
}

export async function POST(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  const payload = (await request.json()) as CredentialPayload;

  if (payload.mode === "challenge") {
    return NextResponse.json({
      challenge: await getFreshClobAuthTypedData({
        walletAddress: record.session.walletAddress,
      }),
    });
  }

  const validationError = validateDerivePayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    console.info("[trading.credentials] deriving user CLOB credentials", {
      userId: record.session.userId,
      walletAddress: record.session.walletAddress,
      timestamp: payload.timestamp,
      nonce: payload.nonce ?? "0",
    });
    const recoveredAddress = await recoverClobAuthSignerAddress({
      walletAddress: record.session.walletAddress,
      signature: payload.signature ?? "",
      timestamp: payload.timestamp ?? "",
      nonce: payload.nonce,
    });
    const signatureMatchesWallet = recoveredAddress.toLowerCase() === record.session.walletAddress.toLowerCase();

    console.info("[trading.credentials] local L1 signature verification", {
      userId: record.session.userId,
      walletAddress: record.session.walletAddress,
      recoveredAddress,
      signatureMatchesWallet,
      timestamp: payload.timestamp,
      nonce: payload.nonce ?? "0",
    });

    if (!signatureMatchesWallet) {
      return NextResponse.json(
        {
          error: `Wallet signature recovered ${recoveredAddress}, which does not match connected wallet ${record.session.walletAddress}.`,
        },
        { status: 400 },
      );
    }

    const credentials = await deriveUserClobCredentials({
      walletAddress: record.session.walletAddress,
      signature: payload.signature ?? "",
      timestamp: payload.timestamp ?? "",
      nonce: payload.nonce,
    });
    const status = setTradingCredentials(record.session.userId, credentials);
    const storedCredentials = {
      ...credentials,
      derivedAt: status.derivedAt ?? new Date().toISOString(),
    };
    await recordTradingAuditEvent({
      userId: record.session.userId,
      walletAddress: record.session.walletAddress,
      eventType: "credentials_derived",
      detail: {
        storage: status.storage,
        derivedAt: status.derivedAt,
      },
    });

    return NextResponse.json(
      {
        credentials: status,
      },
      {
        headers: {
          "Set-Cookie": createTradingCredentialsCookie({
            userId: record.session.userId,
            credentials: storedCredentials,
          }),
        },
      },
    );
  } catch (error) {
    console.warn("[trading.credentials] derive failed", {
      userId: record.session.userId,
      walletAddress: record.session.walletAddress,
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

function validateDerivePayload(payload: CredentialPayload): string | undefined {
  if (!payload.signature || !/^0x[a-fA-F0-9]+$/.test(payload.signature)) {
    return "Missing or invalid wallet signature.";
  }

  if (!payload.timestamp || !/^\d+$/.test(payload.timestamp)) {
    return "Missing or invalid CLOB auth timestamp.";
  }

  if (payload.nonce !== undefined && !/^\d+$/.test(payload.nonce)) {
    return "Invalid CLOB auth nonce.";
  }

  return undefined;
}
