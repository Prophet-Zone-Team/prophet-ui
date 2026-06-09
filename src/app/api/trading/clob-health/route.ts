import { NextResponse } from "next/server";

import { probeClobApiReachability } from "@/server/trading/clob-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const health = await probeClobApiReachability();

  return NextResponse.json(health);
}
