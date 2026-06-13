export const REFERRAL_SHARE_IMAGE_CACHE_KEY = "prophet_referral_share_image_cache";

type ReferralShareImageCacheEntry = {
  referralCode: string;
  funderAddress?: string;
  url: string;
};

function normalizeReferralCode(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeFunderAddress(value?: string): string {
  return value?.trim().toLowerCase() ?? "";
}

function readCacheEntry(): ReferralShareImageCacheEntry | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(REFERRAL_SHARE_IMAGE_CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ReferralShareImageCacheEntry;
    if (
      typeof parsed.referralCode !== "string" ||
      typeof parsed.url !== "string"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function readReferralShareImageCache(params: {
  referralCode: string;
  funderAddress?: string;
}): string | null {
  const entry = readCacheEntry();
  if (!entry) {
    return null;
  }

  const referralCode = normalizeReferralCode(params.referralCode);
  const funderAddress = normalizeFunderAddress(params.funderAddress);

  if (normalizeReferralCode(entry.referralCode) !== referralCode) {
    return null;
  }

  if (normalizeFunderAddress(entry.funderAddress) !== funderAddress) {
    return null;
  }

  return entry.url;
}

export function writeReferralShareImageCache(params: {
  referralCode: string;
  funderAddress?: string;
  url: string;
}): void {
  if (typeof window === "undefined") {
    return;
  }

  const entry: ReferralShareImageCacheEntry = {
    referralCode: normalizeReferralCode(params.referralCode),
    funderAddress: normalizeFunderAddress(params.funderAddress) || undefined,
    url: params.url,
  };

  window.localStorage.setItem(
    REFERRAL_SHARE_IMAGE_CACHE_KEY,
    JSON.stringify(entry),
  );
}

export function clearReferralShareImageCache(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(REFERRAL_SHARE_IMAGE_CACHE_KEY);
}
