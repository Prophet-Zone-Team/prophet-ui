import { isLocalhostHostname } from "@/lib/runtime/is-secure-app-context";

import { isTwitterCrawler } from "./is-twitter-crawler";

export const TWITTER_PREVIEW_PARAM = "twitterPreview";

export function shouldGenerateGameShareImage(
  headers: Headers,
  twitterPreview?: string | string[] | null,
): boolean {
  const userAgent = headers.get("user-agent");
  const host = headers.get("host") ?? "";
  const hostname = host.split(":")[0] ?? "";
  const previewValue = Array.isArray(twitterPreview)
    ? twitterPreview[0]
    : twitterPreview;

  if (isTwitterCrawler(userAgent)) {
    return true;
  }

  return isLocalhostHostname(hostname) && previewValue === "1";
}
