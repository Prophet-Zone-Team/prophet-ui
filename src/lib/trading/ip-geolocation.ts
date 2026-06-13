export interface IpGeoLookupResult {
  country?: string;
  region?: string;
}

interface IpWhoResponse {
  success?: boolean;
  country_code?: string;
  region_code?: string;
}

export function isPrivateOrLocalIp(ip: string) {
  const normalized = ip.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  if (normalized === "localhost" || normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") {
    return true;
  }

  if (normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return true;
  }

  if (normalized.includes(":")) {
    return normalized.startsWith("::ffff:127.") || normalized.startsWith("::ffff:10.");
  }

  const parts = normalized.split(".").map((part) => Number.parseInt(part, 10));

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;

  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
}

export function parseIpWhoResponse(payload: IpWhoResponse): IpGeoLookupResult | undefined {
  if (payload.success === false) {
    return undefined;
  }

  const country = payload.country_code?.trim().toUpperCase();
  const region = payload.region_code?.trim().toUpperCase();

  if (!country && !region) {
    return undefined;
  }

  return {
    country: country || undefined,
    region: region || undefined,
  };
}
