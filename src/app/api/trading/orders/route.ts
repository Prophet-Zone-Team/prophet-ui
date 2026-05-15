import { NextResponse } from "next/server";

import {
  checkOrderFunding,
  fetchUserBalanceSnapshot,
  getOrderFundingRequirementFromSignedOrder,
  getSignedOrderContext,
  resolveOrderFundingRequirementWithFees,
  type SignedOrderContext,
} from "../../../../server/trading/balances";
import { getOrderBuilderCode } from "../../../../server/trading/builderCode";
import { postSignedUserOrder } from "../../../../server/trading/clobUserClient";
import { refreshSessionEligibilityIfStale } from "../../../../server/trading/eligibility";
import { createTradingSessionCookie, getTradingSessionFromCookie } from "../../../../server/trading/sessionStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SubmitSignedOrderPayload {
  order?: unknown;
  orderType?: "FAK";
  postOnly?: boolean;
  deferExec?: boolean;
}

export async function POST(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  console.info("[trading.orders] submit requested", {
    hasSession: Boolean(record),
    userId: record?.session.userId,
    walletAddress: record?.session.walletAddress,
    funderAddress: record?.session.funderAddress,
    hasCredentials: Boolean(record?.credentials),
  });

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  if (!record.credentials) {
    return NextResponse.json({ error: "User CLOB credentials are required before order submission." }, { status: 409 });
  }

  const eligibility = await refreshSessionEligibilityIfStale(record.session);

  if (eligibility.eligibilityStatus !== "eligible") {
    console.warn("[trading.orders] eligibility failed", {
      userId: record.session.userId,
      status: eligibility.eligibilityStatus,
      country: eligibility.eligibilityCountry,
      region: eligibility.eligibilityRegion,
      reason: eligibility.eligibilityReason,
      checkedAt: eligibility.eligibilityCheckedAt,
    });

    return NextResponse.json(
      {
        error: eligibility.eligibilityReason ?? "Trading is not enabled for this session.",
        eligibilityStatus: eligibility.eligibilityStatus,
      },
      { status: 403 },
    );
  }

  const payload = (await request.json()) as SubmitSignedOrderPayload;
  const validationError = validatePayload(payload);

  if (validationError) {
    console.warn("[trading.orders] validation failed", {
      userId: record.session.userId,
      error: validationError,
    });
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const orderContext = getSignedOrderContext(payload);

  if (!orderContext) {
    console.warn("[trading.orders] signed order malformed", {
      userId: record.session.userId,
    });
    return NextResponse.json({ error: "Signed order payload is incomplete or malformed." }, { status: 400 });
  }

  const ownershipError = validateSignedOrderOwnership({
    order: orderContext,
    funderAddress: record.session.funderAddress,
    signatureType: record.session.signatureType,
    builderCode: getOrderBuilderCode(),
  });

  if (ownershipError) {
    console.warn("[trading.orders] ownership validation failed", {
      userId: record.session.userId,
      error: ownershipError,
      maker: orderContext.maker,
      signer: orderContext.signer,
      expectedFunder: record.session.funderAddress,
      signatureType: orderContext.signatureType,
    });
    return NextResponse.json({ error: ownershipError }, { status: 400 });
  }

  const baseFundingRequirement = getOrderFundingRequirementFromSignedOrder(payload);

  if (!baseFundingRequirement) {
    console.warn("[trading.orders] funding requirement missing", {
      userId: record.session.userId,
    });
    return NextResponse.json({ error: "Unable to derive funding requirements from signed order." }, { status: 400 });
  }

  const fundingRequirement = await resolveOrderFundingRequirementWithFees(baseFundingRequirement, orderContext.tokenId);

  const balances = await fetchUserBalanceSnapshot({
    session: record.session,
    credentials: record.credentials,
    tokenId: orderContext.tokenId,
  });
  const funding = checkOrderFunding({
    balances,
    requirement: fundingRequirement,
  });

  if (funding && (funding.balance !== "pass" || funding.allowance !== "pass")) {
    console.warn("[trading.orders] funding check failed", {
      userId: record.session.userId,
      tokenId: orderContext.tokenId,
      balance: funding.balance,
      allowance: funding.allowance,
      balanceDetail: funding.balanceDetail,
      allowanceDetail: funding.allowanceDetail,
    });
    return NextResponse.json(
      {
        error: [funding.balanceDetail, funding.allowanceDetail].join(" "),
        funding,
      },
      { status: 409 },
    );
  }

  try {
    console.info("[trading.orders] posting signed order", {
      userId: record.session.userId,
      tokenId: orderContext.tokenId,
      orderType: payload.orderType ?? "FAK",
      tradeSide: fundingRequirement.tradeSide,
      cost: fundingRequirement.cost,
      estimatedTakerFee: fundingRequirement.estimatedTakerFee,
      totalCost: fundingRequirement.totalCost,
      size: fundingRequirement.size,
    });
    const result = await postSignedUserOrder({
      address: record.session.walletAddress,
      credentials: record.credentials,
      payload: {
        order: payload.order,
        orderType: payload.orderType ?? "FAK",
        postOnly: payload.postOnly,
        deferExec: payload.deferExec,
      },
    });

    console.info("[trading.orders] post succeeded", {
      userId: record.session.userId,
      tokenId: orderContext.tokenId,
    });

    return NextResponse.json(
      {
        response: result,
        submittedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Set-Cookie": createTradingSessionCookie(eligibility),
        },
      },
    );
  } catch (error) {
    console.warn("[trading.orders] post failed", {
      userId: record.session.userId,
      tokenId: orderContext.tokenId,
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

function validatePayload(payload: SubmitSignedOrderPayload): string | undefined {
  if (!payload.order || typeof payload.order !== "object") {
    return "Missing signed order payload.";
  }

  if (payload.orderType !== "FAK") {
    return "Only FAK orders are supported by this user flow.";
  }

  return undefined;
}

function validateSignedOrderOwnership({
  order,
  funderAddress,
  signatureType,
  builderCode,
}: {
  order: SignedOrderContext;
  funderAddress?: string;
  signatureType: number;
  builderCode: string;
}): string | undefined {
  if (signatureType !== 3 || order.signatureType !== 3) {
    return "This trading flow only accepts signature type 3 deposit-wallet orders.";
  }

  const normalizedFunder = normalizeAddress(funderAddress);

  if (!normalizedFunder) {
    return "Trading session is missing a deposit wallet / funder address.";
  }

  if (normalizeAddress(order.maker) !== normalizedFunder || normalizeAddress(order.signer) !== normalizedFunder) {
    return "Signed order maker and signer must match the session deposit wallet / funder address.";
  }

  const normalizedTaker = normalizeAddress(order.taker);

  if (normalizedTaker && normalizedTaker !== "0x0000000000000000000000000000000000000000") {
    return "Only open CLOB limit orders with the zero taker address are supported.";
  }

  if (order.builder.toLowerCase() !== builderCode.toLowerCase()) {
    return "Signed order builder code does not match the configured product builder code.";
  }

  return undefined;
}

function normalizeAddress(address: string | undefined) {
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return undefined;
  }

  return address.toLowerCase();
}
