import { NextResponse } from "next/server";

import {
  clearTradingSession,
  clearTradingSessionCookie,
  clearTradingCredentialsCookie,
  createTradingSession,
  createTradingSessionCookie,
  getTradingSessionFromCookie,
} from "@/server/trading/session-store";
import { checkTradingEligibility, getClientGeoFromRequest } from "@/server/trading/eligibility";
import {
  assertWhitelistEmailAccess,
  isWhitelistLoginGeo,
} from "@/server/trading/eligibility-whitelist";
import { normalizeWhitelistEmail } from "@/lib/trading/eligibility-whitelist";
import { setupDepositWalletForOwner } from "@/server/trading/deposit-wallet";
import { recordTradingAuditEvent } from "@/server/trading/order-store";
import {
  createTradingSessionChallenge,
  verifyTradingSessionChallenge,
} from "@/server/trading/session-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateSessionPayload {
  walletAddress?: string;
  mode?: "challenge" | "create";
  token?: string;
  signature?: string;
  signatureType?: number;
  email?: string;
}

export async function GET(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  return NextResponse.json({
    session: record?.session,
  });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as CreateSessionPayload;

  if (payload.mode === "challenge") {
    const challengeError = validateChallengePayload(payload);

    if (challengeError) {
      return NextResponse.json({ error: challengeError }, { status: 400 });
    }

    return NextResponse.json({
      challenge: createTradingSessionChallenge(payload.walletAddress ?? ""),
    });
  }

  const validationError = validateCreatePayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    await verifyTradingSessionChallenge({
      walletAddress: payload.walletAddress ?? "",
      token: payload.token ?? "",
      signature: payload.signature ?? "",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 401 },
    );
  }

  const clientGeo = getClientGeoFromRequest(request);
  const eligibility = await checkTradingEligibility(clientGeo);
  const whitelistEmail = payload.email?.trim();
  const whitelistAccess =
    whitelistEmail && isWhitelistLoginGeo(clientGeo)
      ? assertWhitelistEmailAccess(whitelistEmail, clientGeo)
      : undefined;
  const whitelistBypass = whitelistAccess?.ok === true;

  if (eligibility.status === "blocked_region" && !whitelistBypass) {
    return NextResponse.json(
      {
        error: eligibility.reason ?? "Trading is unavailable in your region.",
        eligibilityStatus: eligibility.status,
      },
      { status: 403 },
    );
  }

  const sessionEligibilityStatus = whitelistBypass ? "eligible" : eligibility.status;
  const sessionEligibilityReason = whitelistBypass ? undefined : eligibility.reason;

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
    eligibilityStatus: sessionEligibilityStatus,
    eligibilityCheckedAt: eligibility.checkedAt,
    eligibilityCountry: eligibility.country,
    eligibilityRegion: eligibility.region,
    eligibilityReason: sessionEligibilityReason,
    eligibilityWhitelistEmail: whitelistBypass
      ? normalizeWhitelistEmail(whitelistEmail!)
      : undefined,
  });
  await recordTradingAuditEvent({
    userId: session.userId,
    walletAddress: session.walletAddress,
    eventType: "session_created",
    detail: {
      signatureType: session.signatureType,
      eligibilityStatus: session.eligibilityStatus,
      depositWalletStatus: session.depositWalletStatus,
    },
  });

  const response = NextResponse.json({ session });

  response.headers.append("Set-Cookie", createTradingSessionCookie(session));
  response.headers.append("Set-Cookie", clearTradingCredentialsCookie());

  return response;
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

function validateChallengePayload(payload: CreateSessionPayload): string | undefined {
  if (!payload.walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(payload.walletAddress)) {
    return "walletAddress must be a valid EVM address.";
  }

  return undefined;
}

function validateCreatePayload(payload: CreateSessionPayload): string | undefined {
  const walletError = validateChallengePayload(payload);

  if (walletError) {
    return walletError;
  }

  if (!payload.token || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(payload.token)) {
    return "Missing or invalid trading session challenge token.";
  }

  if (!payload.signature || !/^0x[a-fA-F0-9]+$/.test(payload.signature)) {
    return "Missing or invalid trading session signature.";
  }

  if (payload.signatureType !== undefined && payload.signatureType !== 3) {
    return "This trading flow currently supports Polymarket deposit wallet signature type 3.";
  }

  return undefined;
}
