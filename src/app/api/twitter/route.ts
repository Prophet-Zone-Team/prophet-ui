import { NextRequest } from "next/server";

const SHARE_TITLE = "Prophet";
const SHARE_DESCRIPTION =
  "A World Cup prediction market data terminal with user-owned Polymarket order tooling.";
const SHARE_IMAGE_ALT =
  "Prophet share card with market position and referral details.";
const SHARE_IMAGE_WIDTH = "1200";
const SHARE_IMAGE_HEIGHT = "630";

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function resolveRedirectUrl(link: string | null, requestOrigin: string): string {
  if (!link) {
    return "/";
  }

  try {
    const parsed = new URL(link);
    if (parsed.origin !== requestOrigin) {
      return "/";
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}

function resolveSecureImageUrl(imageUrl: string): string {
  if (!imageUrl) {
    return "";
  }

  try {
    const parsed = new URL(imageUrl);
    if (parsed.protocol === "http:") {
      parsed.protocol = "https:";
      return parsed.toString();
    }
  } catch {
    return imageUrl;
  }

  return imageUrl;
}

export async function GET(request: Request | NextRequest) {
  const parsedUrl = new URL(request.url as string);
  const img = parsedUrl.searchParams.get("img");
  const link = parsedUrl.searchParams.get("link");

  const imageUrl = img || "";
  const secureImageUrl = resolveSecureImageUrl(imageUrl);
  const redirectUrl = resolveRedirectUrl(link, parsedUrl.origin);
  const pageUrl = parsedUrl.toString();

  const res = new Response(
    `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${escapeHtmlAttr(SHARE_TITLE)}</title>
            <meta property="og:type" content="website">
            <meta property="og:site_name" content="Prophet">
            <meta property="og:title" content="${escapeHtmlAttr(SHARE_TITLE)}">
            <meta property="og:description" content="${escapeHtmlAttr(SHARE_DESCRIPTION)}">
            <meta property="og:url" content="${escapeHtmlAttr(pageUrl)}">
            <meta property="og:image" content="${escapeHtmlAttr(imageUrl)}">
            <meta property="og:image:secure_url" content="${escapeHtmlAttr(secureImageUrl)}">
            <meta property="og:image:type" content="image/png">
            <meta property="og:image:width" content="${SHARE_IMAGE_WIDTH}">
            <meta property="og:image:height" content="${SHARE_IMAGE_HEIGHT}">
            <meta property="og:image:alt" content="${escapeHtmlAttr(SHARE_IMAGE_ALT)}">
            <meta name="twitter:site" content="@prophet" />
            <meta name="twitter:creator" content="@prophet" />
            <meta name="twitter:card" content="summary_large_image">
            <meta name="twitter:title" content="${escapeHtmlAttr(SHARE_TITLE)}">
            <meta name="twitter:description" content="${escapeHtmlAttr(SHARE_DESCRIPTION)}">
            <meta name="twitter:image" content="${escapeHtmlAttr(imageUrl)}">
            <meta name="twitter:image:alt" content="${escapeHtmlAttr(SHARE_IMAGE_ALT)}">
            <meta http-equiv="refresh" content="0; url=${escapeHtmlAttr(redirectUrl)}">
        </head>
        <body>
        
        </body>
        </html>`,
    {
      status: 200
    }
  );

  res.headers.set("Content-Type", "text/html; charset=utf-8");
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

  return res;
}
