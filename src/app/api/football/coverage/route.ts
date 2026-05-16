import { NextResponse } from "next/server";

import { getFootballCoverageReport } from "../../../../server/signal-data/footballCoverage";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getFootballCoverageReport());
}
