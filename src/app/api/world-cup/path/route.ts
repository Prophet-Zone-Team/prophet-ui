import { NextResponse, type NextRequest } from "next/server";

import { calculateWorldCupPath } from "../../../../lib/world-cup-path/calculate-path";
import type { FinishType } from "../../../../types/market";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const teamId = request.nextUrl.searchParams.get("teamId");
  const finishType = request.nextUrl.searchParams.get("finishType") as FinishType | null;
  const mode = request.nextUrl.searchParams.get("mode") ?? "GENERAL";
  const qualifiedThirdGroups =
    request.nextUrl.searchParams.get("thirdPlaceGroups") ??
    request.nextUrl.searchParams.get("qualifiedThirdGroups") ??
    "";

  if (!teamId) {
    return NextResponse.json({ error: "teamId is required." }, { status: 400 });
  }

  if (!finishType || !["GROUP_WINNER", "RUNNER_UP", "BEST_THIRD"].includes(finishType)) {
    return NextResponse.json({ error: "finishType must be GROUP_WINNER, RUNNER_UP, or BEST_THIRD." }, { status: 400 });
  }

  if (mode !== "GENERAL" && mode !== "SCENARIO") {
    return NextResponse.json({ error: "mode must be GENERAL or SCENARIO." }, { status: 400 });
  }

  try {
    return NextResponse.json(
      calculateWorldCupPath({
        teamId,
        finishType,
        mode,
        scenario: mode === "SCENARIO"
          ? { qualifiedThirdGroups: qualifiedThirdGroups.split(",").filter(Boolean) }
          : undefined,
      }),
    );
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to calculate path." }, { status: 400 });
  }
}
