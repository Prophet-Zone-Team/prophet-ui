"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

import { AnalyticsProvider } from "@/context/analytics";
import { LocaleProvider } from "@/components/runtime/locale-provider";
import { MobileLoadingScreen } from "@/components/runtime/mobile-loading-screen";
import { NativeAppShell } from "@/components/runtime/native-app-shell";
import { MobileVConsole } from "@/components/runtime/mobile-vconsole";
import type { AppLocale } from "@/i18n/config";

const WalletRuntimeProviders = dynamic(
  () => import("@/components/runtime/wallet-runtime-providers"),
  { ssr: false }
);
const RoadToFinalFloatingPromo = dynamic(
  () => import("@/components/promo/road-to-final-floating-promo"),
  { ssr: false }
);

interface AppRootProps {
  initialSecure: boolean;
  cookie?: string | null;
  initialLocale: AppLocale;
  initialMessages: Record<string, unknown>;
  children: ReactNode;
}

export function AppRoot({
  cookie,
  initialLocale,
  initialMessages,
  children
}: AppRootProps) {
  return (
    <LocaleProvider
      initialLocale={initialLocale}
      initialMessages={initialMessages}
    >
      <AnalyticsProvider>
        <NativeAppShell />
        <MobileLoadingScreen />
        <MobileVConsole />
        <WalletRuntimeProviders cookie={cookie}>
          {children}
          <RoadToFinalFloatingPromo />
        </WalletRuntimeProviders>
      </AnalyticsProvider>
    </LocaleProvider>
  );
}
