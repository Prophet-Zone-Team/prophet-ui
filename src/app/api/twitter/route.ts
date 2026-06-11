import { NextRequest } from "next/server";

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

export async function GET(request: Request | NextRequest) {
  const parsedUrl = new URL(request.url as string);
  const img = parsedUrl.searchParams.get("img");
  const link = parsedUrl.searchParams.get("link");

  const imageUrl = img || "";
  const redirectUrl = resolveRedirectUrl(link, parsedUrl.origin);

  const res = new Response(
    `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="twitter:site" content="@prophet" />
            <meta name="twitter:creator" content="@prophet" />
            <meta name="twitter:card" content="summary_large_image">
            <meta name="twitter:title" content="Prophet">
            <meta name="twitter:description" content="A World Cup prediction market data terminal with user-owned Polymarket order tooling.">
            <meta name="twitter:image" content="${escapeHtmlAttr(imageUrl)}">
            <meta http-equiv="refresh" content="0; url=${escapeHtmlAttr(redirectUrl)}">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta property="og:image:width" content="375">
            <meta property="og:image:height" content="625">
            <title>Prophet</title>
        </head>
        <body>
        
        </body>
        </html>`,
    {
      status: 200
    }
  );

  res.headers.set("Content-Type", "text/html");

  return res;
}
