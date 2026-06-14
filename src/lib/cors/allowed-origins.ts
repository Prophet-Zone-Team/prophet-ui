const DEFAULT_ALLOWED_ORIGINS =
  "http://localhost:3000,https://app.rhea.finance,https://*.ref-finance.com";

interface ExactOriginRule {
  kind: "exact";
  origin: string;
}

interface WildcardOriginRule {
  kind: "wildcard";
  protocol: string;
  baseDomain: string;
}

type OriginRule = ExactOriginRule | WildcardOriginRule;

let cachedRules: OriginRule[] | undefined;

function parseOriginRules(raw: string): OriginRule[] {
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map(parseOriginRule);
}

function parseOriginRule(entry: string): OriginRule {
  const wildcardMatch = entry.match(/^(https?):\/\/\*\.(.+)$/i);

  if (wildcardMatch) {
    return {
      kind: "wildcard",
      protocol: wildcardMatch[1].toLowerCase(),
      baseDomain: wildcardMatch[2].toLowerCase(),
    };
  }

  return {
    kind: "exact",
    origin: entry,
  };
}

function getOriginRules(): OriginRule[] {
  if (cachedRules) {
    return cachedRules;
  }

  const raw = process.env.CORS_ALLOWED_ORIGINS?.trim() || DEFAULT_ALLOWED_ORIGINS;
  cachedRules = parseOriginRules(raw);
  return cachedRules;
}

function matchesWildcardRule(origin: URL, rule: WildcardOriginRule): boolean {
  if (origin.protocol.replace(":", "").toLowerCase() !== rule.protocol) {
    return false;
  }

  const hostname = origin.hostname.toLowerCase();
  return hostname === rule.baseDomain || hostname.endsWith(`.${rule.baseDomain}`);
}

export function getAllowedCorsOrigins(): string[] {
  return getOriginRules().map((rule) =>
    rule.kind === "exact" ? rule.origin : `${rule.protocol}://*.${rule.baseDomain}`,
  );
}

export function isAllowedCorsOrigin(origin: string | null): boolean {
  if (!origin) {
    return false;
  }

  let parsedOrigin: URL;

  try {
    parsedOrigin = new URL(origin);
  } catch {
    return false;
  }

  for (const rule of getOriginRules()) {
    if (rule.kind === "exact") {
      if (origin === rule.origin) {
        return true;
      }
      continue;
    }

    if (matchesWildcardRule(parsedOrigin, rule)) {
      return true;
    }
  }

  return false;
}

/** Resets cached rules — for tests only. */
export function resetAllowedCorsOriginsForTests(): void {
  cachedRules = undefined;
}
