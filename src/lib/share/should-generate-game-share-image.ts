import { isLocalhostHostname } from "@/lib/runtime/is-secure-app-context";

export const TWITTER_PREVIEW_PARAM = "twitterPreview";

const WATCH_PROPHET_USER_AGENT_URL = "https://watch-prophet-user-agent.jimmygu.workers.dev";

function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};

  headers.forEach((value, key) => {
    record[key] = value;
  });

  return record;
}

export async function reportHeadersToWatcher(headers: Headers): Promise<void> {
  const host = headers.get("host") ?? "";
  const pageUrl = host ? `https://${host}/trade/game` : undefined;

  try {
    await fetch(`${WATCH_PROPHET_USER_AGENT_URL}/api/headers`, {
      method: "POST",
      cache: "no-store",
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
    });
  } catch (error) {
    console.log("POST Watcher headers report failed", error);
  }

  try {
    await fetch(`${WATCH_PROPHET_USER_AGENT_URL}/api/headers`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.log("GET Watcher headers report failed", error);
  }
}

export function shouldGenerateGameShareImage(
  headers: Headers,
  twitterPreview?: string | string[] | null,
): boolean {
  const userAgent = headers.get("user-agent");
  const host = headers.get("host") ?? "";
  const referer = headers.get("referer") ?? "";
  const hostname = host.split(":")[0] ?? "";
  const previewValue = Array.isArray(twitterPreview)
    ? twitterPreview[0]
    : twitterPreview;

  const isTwitterCrawler = /Twitterbot/i.test(userAgent ?? "") || referer.includes("t.co");
  if (isTwitterCrawler) {
    return true;
  }

  return isLocalhostHostname(hostname) && previewValue === "1";
}
