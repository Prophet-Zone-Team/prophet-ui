import { NextResponse } from "next/server";

import { getSystemHealthReport } from "@/server/system/health";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getSystemHealthReport());
  } catch (error) {
    return NextResponse.json(
      {
        checkedAt: new Date().toISOString(),
        status: "error",
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to read system health.";
}
