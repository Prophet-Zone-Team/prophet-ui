import { NextResponse, type NextRequest } from "next/server";

import { getSignalDataRepository } from "@/server/signal-data/repository";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const repository = await getSignalDataRepository();
  const teamId = request.nextUrl.searchParams.get("teamId") ?? undefined;
  const context = await repository.readFootballTeamContext({ teamId });

  return NextResponse.json({
    context,
    meta: {
      source: "api-football-cache",
      count: context.length,
      teamId,
    },
  });
}
