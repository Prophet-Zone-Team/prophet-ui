export function resolveAnalyticsPagePath(pathname?: string | null): string | undefined {
  if (pathname) {
    return pathname;
  }

  if (typeof window === "undefined") {
    return undefined;
  }

  const path = window.location.pathname;
  return path || undefined;
}
