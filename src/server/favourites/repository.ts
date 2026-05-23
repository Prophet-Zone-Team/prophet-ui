import { getCloudflareD1Database } from "@/server/cloudflare/d1";
import type { D1Database } from "@/server/market-history/types";
import type { FavouriteEntityType, UserFavourite } from "@/types/market";

interface FavouriteRow {
  id: string;
  user_id: string;
  wallet_address: string;
  entity_type: FavouriteEntityType;
  entity_id: string;
  created_at: string;
}

const memoryFavourites = new Map<string, UserFavourite>();

export async function readUserFavourites(userId: string): Promise<UserFavourite[]> {
  const database = await getCloudflareD1Database();

  if (!database) {
    return [...memoryFavourites.values()]
      .filter((item) => item.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const result = await database
    .prepare(
      `SELECT id, user_id, wallet_address, entity_type, entity_id, created_at
      FROM user_favourites
      WHERE user_id = ?
      ORDER BY created_at DESC`,
    )
    .bind(userId)
    .all<FavouriteRow>();

  return (result.results ?? []).map(mapRow);
}

export async function upsertUserFavourite(input: {
  userId: string;
  walletAddress: string;
  entityType: FavouriteEntityType;
  entityId: string;
}): Promise<UserFavourite> {
  const favourite: UserFavourite = {
    id: `${input.userId}:${input.entityType}:${input.entityId}`,
    userId: input.userId,
    walletAddress: input.walletAddress,
    entityType: input.entityType,
    entityId: input.entityId,
    createdAt: new Date().toISOString(),
  };
  const database = await getCloudflareD1Database();

  if (!database) {
    memoryFavourites.set(favourite.id, favourite);
    return favourite;
  }

  await insertFavourite(database, favourite);
  return favourite;
}

export async function deleteUserFavourite(input: {
  userId: string;
  id?: string;
  entityType?: FavouriteEntityType;
  entityId?: string;
}): Promise<void> {
  const database = await getCloudflareD1Database();

  if (!database) {
    for (const [id, favourite] of memoryFavourites.entries()) {
      const matchesId = input.id && id === input.id;
      const matchesEntity =
        input.entityType &&
        input.entityId &&
        favourite.userId === input.userId &&
        favourite.entityType === input.entityType &&
        favourite.entityId === input.entityId;

      if (matchesId || matchesEntity) {
        memoryFavourites.delete(id);
      }
    }
    return;
  }

  if (input.id) {
    await database.prepare("DELETE FROM user_favourites WHERE user_id = ? AND id = ?").bind(input.userId, input.id).run();
    return;
  }

  if (input.entityType && input.entityId) {
    await database
      .prepare("DELETE FROM user_favourites WHERE user_id = ? AND entity_type = ? AND entity_id = ?")
      .bind(input.userId, input.entityType, input.entityId)
      .run();
  }
}

async function insertFavourite(database: D1Database, favourite: UserFavourite) {
  await database
    .prepare(
      `INSERT INTO user_favourites (
        id,
        user_id,
        wallet_address,
        entity_type,
        entity_id,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, entity_type, entity_id) DO UPDATE SET
        wallet_address = excluded.wallet_address,
        created_at = excluded.created_at`,
    )
    .bind(
      favourite.id,
      favourite.userId,
      favourite.walletAddress,
      favourite.entityType,
      favourite.entityId,
      favourite.createdAt,
    )
    .run();
}

function mapRow(row: FavouriteRow): UserFavourite {
  return {
    id: row.id,
    userId: row.user_id,
    walletAddress: row.wallet_address,
    entityType: row.entity_type,
    entityId: row.entity_id,
    createdAt: row.created_at,
  };
}
