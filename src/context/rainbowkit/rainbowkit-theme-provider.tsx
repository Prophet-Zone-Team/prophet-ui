"use client";

import { useMemo } from "react";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";

import { useConfigHydrated, useDarkModeEnabled } from "@/store";

import { getProphetRainbowTheme } from "@/context/rainbowkit/rainbowkit-theme";

function useResolvedDarkMode(): boolean {
  const darkModeEnabled = useDarkModeEnabled();
  const hasHydrated = useConfigHydrated();

  if (hasHydrated) {
    return darkModeEnabled;
  }

  if (typeof document !== "undefined") {
    return document.documentElement.classList.contains("dark");
  }

  return false;
}

export function RainbowKitThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const resolvedDarkMode = useResolvedDarkMode();
  const theme = useMemo(
    () => getProphetRainbowTheme(resolvedDarkMode),
    [resolvedDarkMode],
  );

  return (
    <RainbowKitProvider modalSize="compact" locale="en-US" theme={theme}>
      {children}
    </RainbowKitProvider>
  );
}
