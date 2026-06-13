import { isLocalhostHostname } from "@/lib/runtime/is-secure-app-context";

import { isTwitterCrawler } from "./is-twitter-crawler";

export const TWITTER_PREVIEW_PARAM = "twitterPreview";

const WATCH_PROPHET_USER_AGENT_URL = "https://watch-prophet-user-agent.jimmygu.workers.dev";

function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};

  headers.forEach((value, key) => {
    record[key] = value;
  });

  return record;
}

function reportHeadersToWatcher(headers: Headers): void {
  const host = headers.get("host") ?? "";
  const pageUrl = host ? `https://${host}/trade/game` : undefined;

  void fetch(`${WATCH_PROPHET_USER_AGENT_URL}/api/headers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      headers: headersToRecord(headers),
      meta: {
        pageUrl,
        timestamp: new Date().toISOString(),
      },
    }),
  }).catch(() => undefined);
}

export function shouldGenerateGameShareImage(
  headers: Headers,
  twitterPreview?: string | string[] | null,
): boolean {
  reportHeadersToWatcher(headers);

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
