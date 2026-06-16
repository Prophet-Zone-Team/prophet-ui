"use client";

import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/auth";
import RainbowProvider from "@/context/rainbowkit/provider";
import { MigrateProvider } from "@/context/migrate";
import { ProphetNotificationWsProvider } from "@/context/prophet-notification-ws";
import { SportsWsProvider } from "@/context/sports-ws";
import { AppChrome } from "@/layout/app-chrome";

interface WalletRuntimeProvidersProps {
  cookie?: string | null;
  children: ReactNode;
}

export default function WalletRuntimeProviders({
  cookie,
  children,
}: WalletRuntimeProvidersProps) {
  return (
    <RainbowProvider cookie={cookie}>
      <AuthProvider>
        <MigrateProvider>
          <SportsWsProvider>
            <ProphetNotificationWsProvider>
              <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden font-body">
                <AppChrome>{children}</AppChrome>
              </main>
              <Toaster />
            </ProphetNotificationWsProvider>
          </SportsWsProvider>
        </MigrateProvider>
      </AuthProvider>
    </RainbowProvider>
  );
}
