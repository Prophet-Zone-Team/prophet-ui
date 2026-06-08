import { NextResponse } from "next/server";

import {
  checkOrderFunding,
  fetchUserBalanceSnapshot,
  getOrderFundingRequirementFromSignedOrder,
  getSignedOrderContext,
  resolveOrderFundingRequirementWithFees,
} from "@/server/trading/balances";
import { getClobOrderSubmissionStatus } from "@/server/trading/clob-auth";
import { postSignedUserOrder, updateUserBalanceAllowance } from "@/server/trading/clob-user-client";
import {
  getClientGeoFromRequest,
  refreshSessionEligibilityIfStale,
} from "@/server/trading/eligibility";
import {
  assertEligibilityForOrder,
  signedOrderSideToEligibilitySide,
} from "@/server/trading/eligibility-order-guard";
import { recordUserOrderError, recordUserOrderSubmitted } from "@/server/trading/order-store";
import {
  getSubmittedOrderStatus,
  validateSignedOrderExecutionPrice,
  validateSignedOrderOwnership,
  validateSignedOrderPayload,
  validateSignedOrderPreview,
  type SubmitSignedOrderPayload
} from "@/server/trading/signed-order-validation";
import { createTradingSessionCookie, getTradingSessionFromCookie } from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const eligibility = await refreshSessionEligibilityIfStale(
    record.session,
    getClientGeoFromRequest(request),
  );

  const payload = (await request.json()) as SubmitSignedOrderPayload;
  const validationError = validateSignedOrderPayload(payload);

  if (validationError) {
    console.warn("[trading.orders] validation failed", {
      userId: record.session.userId,
      error: validationError,
    });
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const orderType = payload.orderType ?? "FAK";

  const orderContext = getSignedOrderContext(payload);

  if (!orderContext) {
    console.warn("[trading.orders] signed order malformed", {
      userId: record.session.userId,
    });
    return NextResponse.json({ error: "Signed order payload is incomplete or malformed." }, { status: 400 });
  }

  const orderEligibility = assertEligibilityForOrder(
    eligibility,
    signedOrderSideToEligibilitySide(orderContext.side),
  );

  if (!orderEligibility.ok) {
    console.warn("[trading.orders] eligibility failed", {
      userId: record.session.userId,
      status: orderEligibility.status,
      country: eligibility.eligibilityCountry,
      region: eligibility.eligibilityRegion,
      reason: orderEligibility.reason,
      checkedAt: eligibility.eligibilityCheckedAt,
      side: orderContext.side,
    });

    return NextResponse.json(
      {
        error: orderEligibility.reason,
        eligibilityStatus: orderEligibility.status,
      },
      { status: 403 },
    );
  }

  const ownershipError = validateSignedOrderOwnership({
    order: orderContext,
    funderAddress: record.session.funderAddress,
    signatureType: record.session.signatureType,
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

  const previewError = validateSignedOrderPreview(
    payload.preview,
    orderContext,
    orderType
  );

  if (previewError) {
    console.warn("[trading.orders] preview validation failed", {
      userId: record.session.userId,
      error: previewError,
      tokenId: orderContext.tokenId,
    });
    return NextResponse.json({ error: previewError }, { status: 400 });
  }

  const executionPriceError =
    orderType === "FAK"
      ? await validateSignedOrderExecutionPrice(orderContext)
      : undefined;

  if (executionPriceError) {
    console.warn("[trading.orders] execution price guard failed", {
      userId: record.session.userId,
      error: executionPriceError,
      tokenId: orderContext.tokenId,
    });
    return NextResponse.json({ error: executionPriceError }, { status: 409 });
  }

  const baseFundingRequirement = getOrderFundingRequirementFromSignedOrder(payload);

  if (!baseFundingRequirement) {
    console.warn("[trading.orders] funding requirement missing", {
      userId: record.session.userId,
    });
    return NextResponse.json({ error: "Unable to derive funding requirements from signed order." }, { status: 400 });
  }

  const fundingRequirement = await resolveOrderFundingRequirementWithFees(baseFundingRequirement, orderContext.tokenId);

  await updateUserBalanceAllowance({
    address: record.session.walletAddress,
    credentials: record.credentials,
    signatureType: record.session.signatureType,
    tokenId: orderContext.tokenId,
  }).catch((error) => {
    console.warn("[trading.orders] balance allowance update failed before funding check", {
      userId: record.session.userId,
      tokenId: orderContext.tokenId,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  const balances = await fetchUserBalanceSnapshot({
    session: record.session,
    credentials: record.credentials,
    tokenId: orderContext.tokenId,
    includeOnchain: true,
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
    const submittedAt = new Date().toISOString();
    const persistedOrder = payload.preview
      ? await recordUserOrderSubmitted({
          session: record.session,
          preview: payload.preview,
          response: result,
          status: getSubmittedOrderStatus(result),
          submittedAt,
        })
      : undefined;

    return NextResponse.json(
      {
        response: result,
        order: persistedOrder,
        submittedAt,
      },
      {
        headers: {
          "Set-Cookie": createTradingSessionCookie(eligibility),
        },
      },
    );
  } catch (error) {
    await recordUserOrderError({
      session: record.session,
      preview: payload.preview,
      error: error instanceof Error ? error.message : String(error),
    });

    console.warn("[trading.orders] post failed", {
      userId: record.session.userId,
      tokenId: orderContext.tokenId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: getClobOrderSubmissionStatus(error) },
    );
  }
}
