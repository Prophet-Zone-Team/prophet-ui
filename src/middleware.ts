import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isAllowedCorsOrigin } from "@/lib/cors/allowed-origins";
import { applyCorsHeaders, createCorsPreflightResponse } from "@/lib/cors/cors-headers";
import { isLocalhostHostname } from "@/lib/runtime/is-secure-app-context";

function withApiCors(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin");

  if (isAllowedCorsOrigin(origin) && origin) {
    return applyCorsHeaders(response, origin);
  }

  return response;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");

    if (request.method === "OPTIONS") {
      if (isAllowedCorsOrigin(origin) && origin) {
        return createCorsPreflightResponse(origin);
      }

      return new NextResponse(null, { status: 403 });
    }
  }

  const proto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0] ?? "";

  if (proto === "http" && !isLocalhostHostname(hostname)) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    return withApiCors(request, NextResponse.redirect(url, 308));
  }

  return withApiCors(request, NextResponse.next());
}

export const config = {
  matcher: "/:path*",
};
