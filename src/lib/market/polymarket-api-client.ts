import { fetchJson } from "@/lib/team/client-fetch";

export async function fetchPolymarket<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL("/api/polymarket", window.location.origin);
  url.searchParams.set("path", path.startsWith("/") ? path : `/${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  return fetchJson<T>(url.toString());
}
