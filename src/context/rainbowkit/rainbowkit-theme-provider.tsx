"use client";

import { useMemo } from "react";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";

import { useResolvedDarkMode } from "@/hooks/common/use-resolved-dark-mode";

import { getProphetRainbowTheme } from "@/context/rainbowkit/rainbowkit-theme";

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
