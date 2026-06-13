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
    const getUrl = new URL(`${WATCH_PROPHET_USER_AGENT_URL}/api/headers`);
    getUrl.searchParams.set("headers", JSON.stringify(headersToRecord(headers)));

    if (pageUrl) {
      getUrl.searchParams.set("pageUrl", pageUrl);
    }

    await fetch(getUrl.toString(), {
      method: "GET",
      cache: "no-store",
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
  const previewValue = Array.isArray(twitterPreview)
    ? twitterPreview[0]
    : twitterPreview;

  const isTwitterCrawler = /Twitterbot/i.test(userAgent ?? "") || referer.includes("t.co");
  if (isTwitterCrawler) {
    return true;
  }

  return previewValue === "1";
}
