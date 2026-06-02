import type { ReactNode } from "react";
import { headers } from "next/headers";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/auth";
import { ProphetNotificationWsProvider } from "@/context/prophet-notification-ws";
import { SportsWsProvider } from "@/context/sports-ws";
import { AppChrome } from "@/layout/app-chrome";
import "@/app/globals.css";
import { Metadata } from "@/context/rainbowkit/metadata";
import RainbowProvider from "@/context/rainbowkit/provider";
import Script from "next/script";

export const metadata = {
  title: Metadata.name,
  description: Metadata.description,
  icons: {
    icon: Metadata.icons[0],
    shortcut: Metadata.icons[0],
    apple: Metadata.icons[0]
  }
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookie = (await headers()).get("cookie");

  return (
    <html lang="en">
      <Script
        id="telegram-widget"
        src="https://telegram.org/js/telegram-widget.js?22"
      />
      <body className="bg-[#F9FAFC] min-h-screen">
        <RainbowProvider cookie={cookie}>
          <AuthProvider>
            <SportsWsProvider>
              <ProphetNotificationWsProvider>
                <main className="min-h-screen overflow-x-hidden font-body">
                  <AppChrome>{children}</AppChrome>
                </main>
                <Toaster />
              </ProphetNotificationWsProvider>
            </SportsWsProvider>
          </AuthProvider>
        </RainbowProvider>
      </body>
    </html>
  );
}
