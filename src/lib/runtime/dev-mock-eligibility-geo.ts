import type { NextRequest } from "next/server";

import { isLocalhostHostname } from "@/lib/runtime/is-secure-app-context";

export function getDevMockEligibilityGeoCountry(): string | undefined {
  if (process.env.NODE_ENV !== "development") {
    return undefined;
  }

  const country = process.env.DEV_MOCK_ELIGIBILITY_GEO_COUNTRY?.trim().toUpperCase();

  return country || undefined;
}

export function applyDevMockEligibilityGeoHeaders(
  request: NextRequest,
  hostname: string,
): Headers {
  const headers = new Headers(request.headers);
  const mockCountry = getDevMockEligibilityGeoCountry();

  if (!mockCountry || !isLocalhostHostname(hostname)) {
    return headers;
  }

  if (!headers.get("cf-ipcountry")?.trim() && !headers.get("x-vercel-ip-country")?.trim()) {
    headers.set("cf-ipcountry", mockCountry);
  }

  return headers;
}
