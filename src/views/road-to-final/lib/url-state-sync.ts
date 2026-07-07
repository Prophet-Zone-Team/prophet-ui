import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { encodeUrlState, type RoadToFinalSharedState } from "./url-state";

export function replaceRoadToFinalUrlState(
  router: AppRouterInstance,
  pathname: string,
  state: RoadToFinalSharedState
): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("state", encodeUrlState(state));
  router.replace(`${pathname}?${url.searchParams.toString()}`, { scroll: false });
}
