import { NextRequest } from "next/server";
export const runtime = "edge";

export async function GET(request: Request | NextRequest) {
  const parsedUrl = new URL(request.url as string);
  const img = parsedUrl.searchParams.get("img");

  const imageUrl = img || "";

  const res = new Response(
    `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="twitter:site" content="@prophet" />
            <meta name="twitter:creator" content="@prophet" />
            <meta name="twitter:card" content="summary_large_image">
            <meta name="twitter:title" content="Track signals. Trade smarter.">
            <meta name="twitter:description" content="A World Cup prediction market data terminal with user-owned Polymarket order tooling.">
            <meta name="twitter:image" content="${imageUrl}">
            <meta http-equiv="refresh" content="0; url=/">
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
