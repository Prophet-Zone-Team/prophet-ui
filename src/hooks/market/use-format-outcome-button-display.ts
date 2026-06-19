"use client";

import { useCallback } from "react";

import { formatOutcomeButtonDisplay } from "@/lib/market/order-math";
import { useResolvedOutcomeDisplayMode } from "@/store/user-config-store";

export function useFormatOutcomeButtonDisplay() {
  const mode = useResolvedOutcomeDisplayMode();

  return useCallback(
    (price: number) => formatOutcomeButtonDisplay(price, mode),
    [mode]
  );
}
