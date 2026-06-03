import { NextResponse } from "next/server";

import {
  checkOrderFunding,
  fetchUserBalanceSnapshot,
  getOrderFundingRequirementFromSignedOrder,
  getSignedOrderContext,
  resolveOrderFundingRequirementWithFees,
  type OrderFundingRequirement
} from "@/server/trading/balances";
import { getClobOrderSubmissionStatus } from "@/server/trading/clob-auth";
import {
  postSignedUserOrders,
  updateUserBalanceAllowance
} from "@/server/trading/clob-user-client";
import {
  getClientIp,
  refreshSessionEligibilityIfStale
} from "@/server/trading/eligibility";
import { recordUserOrderError, recordUserOrderSubmitted } from "@/server/trading/order-store";
import {
  getSubmittedOrderStatus,
  validateSignedOrderExecutionPrice,
  validateSignedOrderOwnership,
  validateSignedOrderPayload,
  validateSignedOrderPreview,
  type SubmitSignedOrderPayload
} from "@/server/trading/signed-order-validation";
import {
  createTradingSessionCookie,
  getTradingSessionFromCookie
} from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BATCH_ORDERS = 15;

type SubmitSignedOrdersBatchPayload = {
  orders?: SubmitSignedOrderPayload[];
};

export async function POST(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  if (!record.credentials) {
    return NextResponse.json(
      { error: "User CLOB credentials are required before order submission." },
      { status: 409 }
    );
  }

  const eligibility = await refreshSessionEligibilityIfStale(
    record.session,
    getClientIp(request)
  );

  if (eligibility.eligibilityStatus !== "eligible") {
    return NextResponse.json(
      {
        error:
          eligibility.eligibilityReason ??
          "Trading is not enabled for this session.",
        eligibilityStatus: eligibility.eligibilityStatus
      },
      { status: 403 }
    );
  }

  const payload = (await request.json()) as SubmitSignedOrdersBatchPayload;
  const orders = payload.orders;

  if (!Array.isArray(orders) || orders.length === 0) {
    return NextResponse.json({ error: "Missing signed order payloads." }, { status: 400 });
  }

  if (orders.length > MAX_BATCH_ORDERS) {
    return NextResponse.json(
      {
        error: `Too many orders in payload: ${orders.length}, max allowed: ${MAX_BATCH_ORDERS}`
      },
      { status: 400 }
    );
  }

  const validatedOrders: Array<{
    payload: SubmitSignedOrderPayload;
    orderType: "FAK" | "GTC";
    fundingRequirement: OrderFundingRequirement;
    tokenId: string;
  }> = [];

  for (const [index, orderPayload] of orders.entries()) {
    const validationError = validateSignedOrderPayload(orderPayload);

    if (validationError) {
      return NextResponse.json(
        { error: `Order ${index + 1}: ${validationError}` },
        { status: 400 }
      );
    }

    const orderType = orderPayload.orderType ?? "FAK";
    const orderContext = getSignedOrderContext(orderPayload);

    if (!orderContext) {
      return NextResponse.json(
        { error: `Order ${index + 1}: Signed order payload is incomplete or malformed.` },
        { status: 400 }
      );
    }

    const ownershipError = validateSignedOrderOwnership({
      order: orderContext,
      funderAddress: record.session.funderAddress,
      signatureType: record.session.signatureType
    });

    if (ownershipError) {
      return NextResponse.json(
        { error: `Order ${index + 1}: ${ownershipError}` },
        { status: 400 }
      );
    }

    const previewError = validateSignedOrderPreview(
      orderPayload.preview,
      orderContext,
      orderType
    );

    if (previewError) {
      return NextResponse.json(
        { error: `Order ${index + 1}: ${previewError}` },
        { status: 400 }
      );
    }

    const executionPriceError =
      orderType === "FAK"
        ? await validateSignedOrderExecutionPrice(orderContext)
        : undefined;

    if (executionPriceError) {
      return NextResponse.json(
        { error: `Order ${index + 1}: ${executionPriceError}` },
        { status: 409 }
      );
    }

    const baseFundingRequirement =
      getOrderFundingRequirementFromSignedOrder(orderPayload);

    if (!baseFundingRequirement) {
      return NextResponse.json(
        {
          error: `Order ${index + 1}: Unable to derive funding requirements from signed order.`
        },
        { status: 400 }
      );
    }

    const fundingRequirement = await resolveOrderFundingRequirementWithFees(
      baseFundingRequirement,
      orderContext.tokenId
    );

    validatedOrders.push({
      payload: orderPayload,
      orderType,
      fundingRequirement,
      tokenId: orderContext.tokenId
    });
  }

  const aggregateFunding = sumBuyFundingRequirements(
    validatedOrders.map((entry) => entry.fundingRequirement)
  );

  const primaryTokenId = validatedOrders[0]?.tokenId;

  if (primaryTokenId) {
    await updateUserBalanceAllowance({
      address: record.session.walletAddress,
      credentials: record.credentials,
      signatureType: record.session.signatureType,
      tokenId: primaryTokenId
    }).catch(() => undefined);
  }

  const balances = await fetchUserBalanceSnapshot({
    session: record.session,
    credentials: record.credentials,
    tokenId: primaryTokenId
  });
  const funding = checkOrderFunding({
    balances,
    requirement: aggregateFunding
  });

  if (funding && (funding.balance !== "pass" || funding.allowance !== "pass")) {
    return NextResponse.json(
      {
        error: [funding.balanceDetail, funding.allowanceDetail].join(" "),
        funding
      },
      { status: 409 }
    );
  }

  try {
    const responses = await postSignedUserOrders({
      address: record.session.walletAddress,
      credentials: record.credentials,
      payloads: validatedOrders.map((entry) => ({
        order: entry.payload.order,
        orderType: entry.orderType,
        postOnly: entry.payload.postOnly,
        deferExec: entry.payload.deferExec
      }))
    });

    const submittedAt = new Date().toISOString();
    const results = await Promise.all(
      validatedOrders.map(async (entry, index) => {
        const response = responses[index];
        const preview = entry.payload.preview;
        const responseObject =
          response && typeof response === "object"
            ? (response as { success?: boolean; errorMsg?: string })
            : undefined;
        const succeeded = responseObject?.success !== false;

        if (succeeded && preview) {
          const persistedOrder = await recordUserOrderSubmitted({
            session: record.session,
            preview,
            response,
            status: getSubmittedOrderStatus(response),
            submittedAt
          });

          return {
            index,
            success: true,
            order: persistedOrder,
            response
          };
        }

        const errorMessage =
          responseObject?.errorMsg ??
          (typeof response === "string" ? response : "Order submission failed.");

        if (preview) {
          await recordUserOrderError({
            session: record.session,
            preview,
            error: errorMessage
          });
        }

        return {
          index,
          success: false,
          error: errorMessage,
          response
        };
      })
    );

    const successCount = results.filter((entry) => entry.success).length;

    return NextResponse.json(
      {
        results,
        successCount,
        failureCount: results.length - successCount,
        submittedAt
      },
      {
        headers: {
          "Set-Cookie": createTradingSessionCookie(eligibility)
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error)
      },
      { status: getClobOrderSubmissionStatus(error) }
    );
  }
}

function sumBuyFundingRequirements(
  requirements: OrderFundingRequirement[]
): OrderFundingRequirement {
  const totalCost = requirements.reduce(
    (sum, requirement) => sum + (requirement.totalCost ?? requirement.cost),
    0
  );
  const cost = requirements.reduce((sum, requirement) => sum + requirement.cost, 0);
  const estimatedTakerFee = requirements.reduce(
    (sum, requirement) => sum + (requirement.estimatedTakerFee ?? 0),
    0
  );
  const size = requirements.reduce((sum, requirement) => sum + requirement.size, 0);

  return {
    tradeSide: "buy",
    cost,
    size,
    estimatedTakerFee,
    totalCost
  };
}
