import { NextResponse } from "next/server";

import { isValidBridgeStatusAddress } from "@/lib/funding/recipient-validation";
import {
  createBridgeDepositAddresses,
  fetchBridgeTransactionStatus,
} from "@/server/trading/bridge";
import { getTradingChainId } from "@/server/trading/clob-auth";
import { getTradingContractAddresses } from "@/server/trading/contracts";
import {
  getClientGeoFromRequest,
  refreshSessionEligibilityIfStale,
} from "@/server/trading/eligibility";
import { assertEligibilityForBuySetup } from "@/server/trading/eligibility-order-guard";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";

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
      const normalizedStatusAddress = statusAddress.trim();

      if (!isValidBridgeStatusAddress(normalizedStatusAddress)) {
        return NextResponse.json(
          { error: "statusAddress must be a valid EVM, Tron, or Solana address." },
          { status: 400 },
        );
      }

      return NextResponse.json({
        status: await fetchBridgeTransactionStatus(normalizedStatusAddress),
      });
    }

    const eligibility = await refreshSessionEligibilityIfStale(
      record.session,
      getClientGeoFromRequest(request),
    );
    const depositEligibility = assertEligibilityForBuySetup(eligibility);

    if (!depositEligibility.ok) {
      return NextResponse.json(
        {
          error: depositEligibility.reason,
          eligibilityStatus: depositEligibility.status,
        },
        { status: 403 },
      );
    }

    const contracts = getTradingContractAddresses();

    return NextResponse.json({
      deposit: await createBridgeDepositAddresses(record.session.funderAddress),
      funderAddress: record.session.funderAddress,
      chainId: getTradingChainId(),
      collateralToken: contracts.collateralToken,
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
