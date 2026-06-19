import { mapProphetComboMarketsResponse } from "@/lib/combo/map-prophet-combo-markets";
import { getProphetApiBaseUrl } from "@/service/prophet";
import type { ComboMarketsDay, ComboMarketsResponse } from "@/types/combo";
import type {
  ProphetApiResponse,
  ProphetGetComboMarketsData,
} from "@/types/prophet-api";

export interface FetchProphetComboMarketsOptions {
  limit?: number;
  cursor?: string;
  exclude?: string[];
  timezone?: string;
  day?: ComboMarketsDay;
  signal?: AbortSignal;
}

export async function fetchProphetComboMarkets(
  options: FetchProphetComboMarketsOptions = {},
): Promise<ComboMarketsResponse> {
  if (options.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const day = options.day ?? "today";
  const isAllTab = day === "all";
  const timezone = resolveRequestTimezone(options.timezone);
  const url = isAllTab
    ? `${getProphetApiBaseUrl()}/v1/game/combo-markets`
    : `${getProphetApiBaseUrl()}/v1/game/combo-markets?${new URLSearchParams({
        timezone,
        day,
      }).toString()}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`Prophet combo markets request failed (${response.status})`);
  }

  const payload = (await response.json()) as ProphetApiResponse<ProphetGetComboMarketsData>;

  if (payload.code !== 0) {
    throw new Error(payload.message || "Prophet combo markets request failed.");
  }

  const mapped = mapProphetComboMarketsResponse(payload.data);
  const excludeSet = new Set(
    (options.exclude ?? []).map((entry) => entry.trim()).filter(Boolean),
  );
  const filteredGroups = mapped.groups
    .map((group) => ({
      ...group,
      markets: group.markets.filter((market) => !excludeSet.has(market.id)),
    }))
    .filter((group) => group.markets.length > 0);

  if (isAllTab) {
    return {
      groups: filteredGroups,
      markets: filteredGroups.flatMap((group) => group.markets),
      nextCursor: null,
    };
  }

  const limit = Math.max(1, Math.min(options.limit ?? 50, 100));
  const offset = resolveCursorOffset(options.cursor);
  const pagedGroups = filteredGroups.slice(offset, offset + limit);
  const nextOffset = offset + limit;
  const nextCursor =
    nextOffset < filteredGroups.length ? String(nextOffset) : null;

  return {
    groups: pagedGroups,
    markets: pagedGroups.flatMap((group) => group.markets),
    nextCursor,
  };
}

function resolveCursorOffset(cursor: string | undefined): number {
  if (!cursor?.trim()) {
    return 0;
  }

  const parsed = Number.parseInt(cursor, 10);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function resolveRequestTimezone(timezone: string | undefined): string {
  const trimmed = timezone?.trim();

  if (trimmed) {
    return trimmed;
  }

  if (typeof Intl !== "undefined") {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  return "UTC";
}
