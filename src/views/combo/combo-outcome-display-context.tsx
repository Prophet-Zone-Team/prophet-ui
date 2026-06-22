"use client";

import {
  createContext,
  useCallback,
  useContext,
  type ReactNode
} from "react";

import { formatOutcomeButtonDisplay } from "@/lib/market/order-math";
import type { OutcomeDisplayMode } from "@/lib/market/outcome-display-mode";

const ComboOutcomeDisplayContext = createContext<OutcomeDisplayMode | null>(
  null
);

export function ComboOutcomeDisplayProvider({
  mode,
  children
}: {
  mode: OutcomeDisplayMode;
  children: ReactNode;
}) {
  return (
    <ComboOutcomeDisplayContext.Provider value={mode}>
      {children}
    </ComboOutcomeDisplayContext.Provider>
  );
}

function useComboOutcomeDisplayMode(): OutcomeDisplayMode {
  const mode = useContext(ComboOutcomeDisplayContext);

  if (!mode) {
    throw new Error(
      "useComboFormatOutcomeButtonDisplay must be used within ComboOutcomeDisplayProvider"
    );
  }

  return mode;
}

export function useComboFormatOutcomeButtonDisplay() {
  const mode = useComboOutcomeDisplayMode();

  return useCallback(
    (price: number) => formatOutcomeButtonDisplay(price, mode),
    [mode]
  );
}
