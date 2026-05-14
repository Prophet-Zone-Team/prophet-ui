import { NextResponse } from "next/server";

import {
  clearTradingSession,
  clearTradingSessionCookie,
  clearTradingCredentialsCookie,
  createTradingSession,
  createTradingSessionCookie,
  getTradingSessionFromCookie,
} from "../../../../server/trading/sessionStore";
import { checkTradingEligibility } from "../../../../server/trading/eligibility";
import { setupDepositWalletForOwner } from "../../../../server/trading/depositWallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateSessionPayload {
  walletAddress?: string;
  signatureType?: number;
}

export async function GET(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  return NextResponse.json({
    session: record?.session,
  });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as CreateSessionPayload;
  const validationError = validatePayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const eligibility = await checkTradingEligibility();
  const depositWallet = await setupDepositWalletForOwner(payload.walletAddress ?? "");
  const session = createTradingSession({
    walletAddress: payload.walletAddress ?? "",
    funderAddress: depositWallet.walletAddress,
    depositWalletStatus: depositWallet.status,
    depositWalletCheckedAt: depositWallet.checkedAt,
    depositWalletTransactionId: depositWallet.transactionId,
    depositWalletTransactionHash: depositWallet.transactionHash,
    depositWalletError: depositWallet.error,
    signatureType: payload.signatureType ?? 3,
    eligibilityStatus: eligibility.status,
    eligibilityCheckedAt: eligibility.checkedAt,
    eligibilityCountry: eligibility.country,
    eligibilityRegion: eligibility.region,
    eligibilityReason: eligibility.reason,
  });

  return NextResponse.json(
    {
      session,
    },
    {
      headers: {
        "Set-Cookie": createTradingSessionCookie(session),
      },
    },
  );
}

export async function DELETE(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));
  clearTradingSession(record?.session.userId);

  const response = NextResponse.json({
    ok: true,
  });

  response.headers.append("Set-Cookie", clearTradingSessionCookie());
  response.headers.append("Set-Cookie", clearTradingCredentialsCookie());

  return response;
}

function validatePayload(payload: CreateSessionPayload): string | undefined {
  if (!payload.walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(payload.walletAddress)) {
    return "walletAddress must be a valid EVM address.";
  }

  if (payload.signatureType !== undefined && payload.signatureType !== 3) {
    return "This trading flow currently supports Polymarket deposit wallet signature type 3.";
  }

  return undefined;
}
