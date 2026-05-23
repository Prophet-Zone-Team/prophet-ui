import { NextResponse } from "next/server";

import {
  KNOCKOUT_LINKS,
  ROUND_OF_32,
  THIRD_PLACE_ALLOCATION_OPTIONS,
  WORLD_CUP_2026_GROUPS,
} from "@/data/world-cup-2026/bracket";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    groups: WORLD_CUP_2026_GROUPS,
    roundOf32: ROUND_OF_32,
    knockoutLinks: KNOCKOUT_LINKS,
    thirdPlaceOptionMeta: {
      count: THIRD_PLACE_ALLOCATION_OPTIONS.length,
      firstOption: THIRD_PLACE_ALLOCATION_OPTIONS[0]?.option,
      lastOption: THIRD_PLACE_ALLOCATION_OPTIONS.at(-1)?.option,
    },
  });
}
