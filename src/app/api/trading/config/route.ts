import { NextResponse } from "next/server";

import { getBuilderTakerFeeRate, getOrderBuilderCode } from "../../../../server/trading/builder-code";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const builderCode = getOrderBuilderCode();

  return NextResponse.json({
    builderCode,
    builderTakerFeeRate: await getBuilderTakerFeeRate(builderCode),
  });
}
