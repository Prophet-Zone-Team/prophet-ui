import { isLocalhostHostname } from "@/lib/runtime/is-secure-app-context";
import type { ProphetAnalyticsTrackEnvironment } from "@/types/prophet-api";

export function resolveAnalyticsEnvironment(): ProphetAnalyticsTrackEnvironment {
  if (typeof window !== "undefined" && isLocalhostHostname(window.location.hostname)) {
    return "local";
  }

  if (process.env.VERCEL_ENV === "preview") {
    return "preview";
  }

  if (process.env.NEXT_PUBLIC_ENV === "production") {
    return "production";
  }

  if (process.env.NODE_ENV === "development") {
    return "local";
  }

  return "preview";
}
