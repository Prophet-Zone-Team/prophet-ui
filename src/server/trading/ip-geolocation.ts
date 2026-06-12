import "server-only";

import {
  isPrivateOrLocalIp,
  parseIpWhoResponse,
  type IpGeoLookupResult
} from "@/lib/trading/ip-geolocation";
import { serverFetch } from "@/server/trading/server-fetch";

const DEFAULT_GEOIP_LOOKUP_URL = "https://ipwho.is/{ip}";
const GEOIP_LOOKUP_TIMEOUT_MS = 3000;

export type { IpGeoLookupResult };

export async function lookupGeoFromIp(
  ip: string
): Promise<IpGeoLookupResult | undefined> {
  if (isPrivateOrLocalIp(ip)) {
    return undefined;
  }

  const urlTemplate =
    process.env.GEOIP_LOOKUP_URL?.trim() || DEFAULT_GEOIP_LOOKUP_URL;
  const url = urlTemplate.replace("{ip}", encodeURIComponent(ip));

  try {
    const response = await serverFetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(GEOIP_LOOKUP_TIMEOUT_MS)
    });

    if (!response.ok) {
      return undefined;
    }

    const payload = await response.json();

    return parseIpWhoResponse(payload);
  } catch {
    return undefined;
  }
}
