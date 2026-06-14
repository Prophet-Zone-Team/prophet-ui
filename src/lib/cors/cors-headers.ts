import { NextResponse } from "next/server";

const CORS_ALLOW_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const CORS_ALLOW_HEADERS = "Content-Type, Authorization, X-Requested-With";
const CORS_MAX_AGE = "86400";

export function applyCorsHeaders(response: NextResponse, origin: string): NextResponse {
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", CORS_ALLOW_METHODS);
  response.headers.set("Access-Control-Allow-Headers", CORS_ALLOW_HEADERS);
  response.headers.set("Access-Control-Max-Age", CORS_MAX_AGE);
  response.headers.append("Vary", "Origin");
  return response;
}

export function createCorsPreflightResponse(origin: string): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return applyCorsHeaders(response, origin);
}
