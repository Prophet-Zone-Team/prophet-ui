import { NextResponse, type NextRequest } from "next/server";

import { deleteUserFavourite, readUserFavourites, upsertUserFavourite } from "../../../server/favourites/repository";
import { getTradingSessionFromCookie } from "../../../server/trading/session-store";
import type { FavouriteEntityType } from "../../../types/market";

export const dynamic = "force-dynamic";

interface FavouritePayload {
  entityType?: FavouriteEntityType;
  entityId?: string;
}

export async function GET(request: NextRequest) {
  const session = getTradingSessionFromCookie(request.headers.get("cookie"))?.session;

  if (!session) {
    return NextResponse.json({ favourites: [], error: "Trading session not found." }, { status: 401 });
  }

  return NextResponse.json({ favourites: await readUserFavourites(session.userId) });
}

export async function POST(request: NextRequest) {
  const session = getTradingSessionFromCookie(request.headers.get("cookie"))?.session;

  if (!session) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  const payload = (await request.json()) as FavouritePayload;
  const validationError = validatePayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const favourite = await upsertUserFavourite({
    userId: session.userId,
    walletAddress: session.walletAddress,
    entityType: payload.entityType ?? "team",
    entityId: payload.entityId ?? "",
  });

  return NextResponse.json({ favourite });
}

export async function DELETE(request: NextRequest) {
  const session = getTradingSessionFromCookie(request.headers.get("cookie"))?.session;

  if (!session) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  await deleteUserFavourite({
    userId: session.userId,
    id: request.nextUrl.searchParams.get("id") ?? undefined,
    entityType: (request.nextUrl.searchParams.get("entityType") as FavouriteEntityType | null) ?? undefined,
    entityId: request.nextUrl.searchParams.get("entityId") ?? undefined,
  });

  return NextResponse.json({ ok: true });
}

function validatePayload(payload: FavouritePayload): string | undefined {
  if (!payload.entityType || !["team", "match", "news", "market"].includes(payload.entityType)) {
    return "entityType must be team, match, news, or market.";
  }

  if (!payload.entityId || typeof payload.entityId !== "string") {
    return "entityId is required.";
  }

  return undefined;
}
