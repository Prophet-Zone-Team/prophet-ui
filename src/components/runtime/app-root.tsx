"use client";

import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { HttpsRequiredPage } from "@/components/runtime/https-required-page";
import { AuthProvider } from "@/context/auth";
import { MigrateProvider } from "@/context/migrate";
import { ProphetNotificationWsProvider } from "@/context/prophet-notification-ws";
import { SportsWsProvider } from "@/context/sports-ws";
import RainbowProvider from "@/context/rainbowkit/provider";
import { LocaleProvider } from "@/components/runtime/locale-provider";
import { AppChrome } from "@/layout/app-chrome";
import type { AppLocale } from "@/i18n/config";
import { isSecureInBrowser } from "@/lib/runtime/is-secure-app-context";

interface AppRootProps {
  initialSecure: boolean;
  cookie?: string | null;
  initialLocale: AppLocale;
  initialMessages: Record<string, unknown>;
  children: ReactNode;
}

export function AppRoot({
  initialSecure,
  cookie,
  initialLocale,
  initialMessages,
  children
}: AppRootProps) {
  const isSecure =
    typeof window !== "undefined" ? isSecureInBrowser() : initialSecure;

  if (!isSecure) {
    return (
      <LocaleProvider initialLocale={initialLocale} initialMessages={initialMessages}>
        <HttpsRequiredPage />
      </LocaleProvider>
    );
  }

  return (
    <LocaleProvider initialLocale={initialLocale} initialMessages={initialMessages}>
      <RainbowProvider cookie={cookie}>
        <AuthProvider>
          <MigrateProvider>
            <SportsWsProvider>
              <ProphetNotificationWsProvider>
                <main className="min-h-screen overflow-x-hidden font-body">
                  <AppChrome>{children}</AppChrome>
                </main>
                <Toaster />
              </ProphetNotificationWsProvider>
            </SportsWsProvider>
          </MigrateProvider>
        </AuthProvider>
      </RainbowProvider>
    </LocaleProvider>
  );
}
