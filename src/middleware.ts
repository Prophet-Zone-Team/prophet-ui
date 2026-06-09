import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isLocalhostHostname } from "@/lib/runtime/is-secure-app-context";

export function middleware(request: NextRequest) {
  const proto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0] ?? "";

  if (proto === "http" && !isLocalhostHostname(hostname)) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
