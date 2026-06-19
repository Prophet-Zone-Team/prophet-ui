"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type {
  ComboPick,
  ComboPickOutcomeSide,
} from "@/views/combo/combo-widget/types";

interface ComboStoreState {
  picks: ComboPick[];
  bidAmount: number;
  setPicks: (picks: ComboPick[]) => void;
  upsertPick: (pick: ComboPick) => void;
  updatePick: (pick: ComboPick) => void;
  updatePickOutcome: (pickId: string, side: ComboPickOutcomeSide) => void;
  removePick: (pickId: string) => void;
  setBidAmount: (bidAmount: number) => void;
  reset: () => void;
}

const initialState = {
  picks: [] as ComboPick[],
  bidAmount: 0,
};

export const useComboStore = create<ComboStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPicks: (picks) => {
        set({ picks: sanitizeComboPicks(picks) });
      },

      upsertPick: (pick) => {
        const sanitized = sanitizeComboPick(pick);

        if (!sanitized) {
          return;
        }

        const previous = get().picks;
        const existingIndex = previous.findIndex((entry) => entry.id === sanitized.id);

        if (existingIndex < 0) {
          set({ picks: [...previous, sanitized] });
          return;
        }

        const next = [...previous];
        next[existingIndex] = sanitized;
        set({ picks: next });
      },

      updatePick: (pick) => {
        const sanitized = sanitizeComboPick(pick);

        if (!sanitized) {
          return;
        }

        set({
          picks: get().picks.map((entry) =>
            entry.id === sanitized.id ? sanitized : entry,
          ),
        });
      },

      updatePickOutcome: (pickId, side) => {
        set({
          picks: get().picks.map((pick) => {
            if (pick.id !== pickId || pick.type !== "moneyline") {
              return pick;
            }

            return {
              ...pick,
              outcomeSide: side,
            };
          }),
        });
      },

      removePick: (pickId) => {
        set({
          picks: get().picks.filter((pick) => pick.id !== pickId),
        });
      },

      setBidAmount: (bidAmount) => {
        set({
          bidAmount: Number.isFinite(bidAmount) && bidAmount >= 0 ? bidAmount : 0,
        });
      },

      reset: () => {
        set({ ...initialState });
      },
    }),
    {
      name: "wc-combo",
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        picks: state.picks,
        bidAmount: state.bidAmount,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<ComboStoreState> | undefined;

        return {
          ...current,
          picks: sanitizeComboPicks(persistedState?.picks),
          bidAmount:
            typeof persistedState?.bidAmount === "number" &&
            Number.isFinite(persistedState.bidAmount) &&
            persistedState.bidAmount >= 0
              ? persistedState.bidAmount
              : 0,
        };
      },
    },
  ),
);

export function useComboPicks() {
  return useComboStore((state) => state.picks);
}

export function useComboBidAmount() {
  return useComboStore((state) => state.bidAmount);
}

export function useSetComboPicks() {
  return useComboStore((state) => state.setPicks);
}

export function useUpsertComboPick() {
  return useComboStore((state) => state.upsertPick);
}

export function useUpdateComboPick() {
  return useComboStore((state) => state.updatePick);
}

export function useUpdateComboPickOutcome() {
  return useComboStore((state) => state.updatePickOutcome);
}

export function useRemoveComboPick() {
  return useComboStore((state) => state.removePick);
}

export function useSetComboBidAmount() {
  return useComboStore((state) => state.setBidAmount);
}

export function useResetComboStore() {
  return useComboStore((state) => state.reset);
}

function sanitizeComboPicks(value: unknown): ComboPick[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(sanitizeComboPick)
    .filter((pick): pick is ComboPick => Boolean(pick));
}

function sanitizeComboPick(value: unknown): ComboPick | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const pick = value as Partial<ComboPick>;

  if (
    typeof pick.id !== "string" ||
    !pick.id.trim() ||
    typeof pick.matchupLabel !== "string" ||
    typeof pick.selectionLabel !== "string" ||
    !pick.team ||
    typeof pick.team.name !== "string" ||
    typeof pick.team.code !== "string"
  ) {
    return undefined;
  }

  if (pick.type === "moneyline") {
    if (pick.outcomeSide !== "yes" && pick.outcomeSide !== "no") {
      return undefined;
    }

    return {
      id: pick.id,
      type: "moneyline",
      outcomeSide: pick.outcomeSide,
      matchupLabel: pick.matchupLabel,
      team: {
        name: pick.team.name,
        code: pick.team.code,
        logoUrl: pick.team.logoUrl,
      },
      selectionLabel: pick.selectionLabel,
      legPositionId: pick.legPositionId,
      referencePrice:
        typeof pick.referencePrice === "number" && pick.referencePrice >= 0
          ? pick.referencePrice
          : undefined,
    };
  }

  if (pick.type === "spread") {
    if (typeof pick.spreadValue !== "string") {
      return undefined;
    }

    return {
      id: pick.id,
      type: "spread",
      spreadValue: pick.spreadValue,
      spreadOptions: Array.isArray(pick.spreadOptions)
        ? pick.spreadOptions.filter((entry): entry is string => typeof entry === "string")
        : undefined,
      matchupLabel: pick.matchupLabel,
      team: {
        name: pick.team.name,
        code: pick.team.code,
        logoUrl: pick.team.logoUrl,
      },
      selectionLabel: pick.selectionLabel,
      legPositionId: pick.legPositionId,
      referencePrice:
        typeof pick.referencePrice === "number" && pick.referencePrice >= 0
          ? pick.referencePrice
          : undefined,
    };
  }

  return undefined;
}
