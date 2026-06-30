"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useLocale as useIntlLocale } from "next-intl";

import { defaultLocale, type AppLocale } from "@/i18n/config";
import {
  resolveOutcomeDisplayMode,
  type OutcomeDisplayMode
} from "@/lib/market/outcome-display-mode";
import { useConfigHydrated } from "@/store/use-config-hydrated";

export type { OutcomeDisplayMode };

export const MIN_FAST_BID_AMOUNT = 5;
export const DEFAULT_FAST_BID_AMOUNT = 10;
export const FAST_BID_PRESET_AMOUNTS = [5, 10, 100, 1000] as const;

interface UserConfigState {
  fastBidAmount: number;
  showOrderbook: boolean;
  showStrategyNotice: boolean;
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
  locale: AppLocale;
  outcomeDisplayMode?: OutcomeDisplayMode;
  setFastBidAmount: (amount: number) => void;
  setShowOrderbook: (value: boolean) => void;
  dismissStrategyNotice: () => void;
  setNotificationsEnabled: (value: boolean) => void;
  setDarkModeEnabled: (value: boolean) => void;
  setLocale: (locale: AppLocale) => void;
  setOutcomeDisplayMode: (mode: OutcomeDisplayMode) => void;
}

export function normalizeFastBidAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    return DEFAULT_FAST_BID_AMOUNT;
  }

  return Math.min(10_000, Math.max(MIN_FAST_BID_AMOUNT, amount));
}

export function formatFastBidAmountDisplay(amount: number): string {
  const normalized = normalizeFastBidAmount(amount);

  if (Number.isInteger(normalized)) {
    return `$${normalized}`;
  }

  return `$${normalized.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}`;
}

export const useUserConfigStore = create<UserConfigState>()(
  persist(
    (set) => ({
      fastBidAmount: DEFAULT_FAST_BID_AMOUNT,
      showOrderbook: true,
      showStrategyNotice: true,
      notificationsEnabled: true,
      darkModeEnabled: false,
      locale: defaultLocale,
      outcomeDisplayMode: undefined,
      setFastBidAmount: (amount) => {
        set({ fastBidAmount: normalizeFastBidAmount(amount) });
      },
      setShowOrderbook: (value) => {
        set({ showOrderbook: value });
      },
      dismissStrategyNotice: () => {
        set({ showStrategyNotice: false });
      },
      setNotificationsEnabled: (value) => {
        set({ notificationsEnabled: value });
      },
      setDarkModeEnabled: (value) => {
        set({ darkModeEnabled: value });
      },
      setLocale: (locale) => {
        if (locale === "zh-TW") {
          set({ outcomeDisplayMode: "decimal" });
        }
        set({ locale });
      },
      setOutcomeDisplayMode: (mode) => {
        set({ outcomeDisplayMode: mode });
      }
    }),
    {
      name: "wc-user-config",
      version: 7,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        fastBidAmount: state.fastBidAmount,
        showOrderbook: state.showOrderbook,
        showStrategyNotice: state.showStrategyNotice,
        notificationsEnabled: state.notificationsEnabled,
        darkModeEnabled: state.darkModeEnabled,
        locale: state.locale,
        outcomeDisplayMode: state.outcomeDisplayMode
      }),
      migrate: (persisted) => {
        const state = persisted as
          | {
              fastBidAmount?: number;
              showOrderbook?: boolean;
              showStrategyNotice?: boolean;
              notificationsEnabled?: boolean;
              darkModeEnabled?: boolean;
              locale?: AppLocale;
              outcomeDisplayMode?: OutcomeDisplayMode;
            }
          | undefined;

        return {
          fastBidAmount: normalizeFastBidAmount(
            state?.fastBidAmount ?? DEFAULT_FAST_BID_AMOUNT
          ),
          showOrderbook: state?.showOrderbook ?? true,
          showStrategyNotice: state?.showStrategyNotice ?? true,
          notificationsEnabled: state?.notificationsEnabled ?? true,
          darkModeEnabled: state?.darkModeEnabled ?? false,
          locale: state?.locale ?? defaultLocale,
          outcomeDisplayMode: state?.outcomeDisplayMode
        };
      }
    }
  )
);

export function useFastBidAmount() {
  return useUserConfigStore((state) => state.fastBidAmount);
}

export function useSetFastBidAmount() {
  return useUserConfigStore((state) => state.setFastBidAmount);
}

export function useShowOrderbook() {
  return useUserConfigStore((state) => state.showOrderbook);
}

export function useSetShowOrderbook() {
  return useUserConfigStore((state) => state.setShowOrderbook);
}

export function useShowStrategyNotice() {
  return useUserConfigStore((state) => state.showStrategyNotice);
}

export function useDismissStrategyNotice() {
  return useUserConfigStore((state) => state.dismissStrategyNotice);
}

export function useNotificationsEnabled() {
  return useUserConfigStore((state) => state.notificationsEnabled);
}

export function useSetNotificationsEnabled() {
  return useUserConfigStore((state) => state.setNotificationsEnabled);
}

export function useDarkModeEnabled() {
  return useUserConfigStore((state) => state.darkModeEnabled);
}

export function useSetDarkModeEnabled() {
  return useUserConfigStore((state) => state.setDarkModeEnabled);
}

export function useLocale() {
  return useUserConfigStore((state) => state.locale);
}

export function useSetLocale() {
  return useUserConfigStore((state) => state.setLocale);
}

export function useOutcomeDisplayModePreference() {
  return useUserConfigStore((state) => state.outcomeDisplayMode);
}

export function useSetOutcomeDisplayMode() {
  return useUserConfigStore((state) => state.setOutcomeDisplayMode);
}

export function useResolvedOutcomeDisplayMode(): OutcomeDisplayMode {
  const hydrated = useConfigHydrated();
  const intlLocale = useIntlLocale() as AppLocale;
  const storeLocale = useUserConfigStore((state) => state.locale);
  const stored = useOutcomeDisplayModePreference();
  const locale = hydrated ? storeLocale : intlLocale;

  return resolveOutcomeDisplayMode(locale, hydrated ? stored : undefined);
}
