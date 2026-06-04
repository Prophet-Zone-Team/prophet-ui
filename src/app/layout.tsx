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
      <Script id="crypto-randomuuid-polyfill" strategy="beforeInteractive">
        {`
          (function () {
            if (typeof globalThis.crypto?.randomUUID === "function") return;
            globalThis.crypto = globalThis.crypto || {};
            globalThis.crypto.randomUUID = function () {
              var bytes = new Uint8Array(16);
              globalThis.crypto.getRandomValues(bytes);
              bytes[6] = (bytes[6] & 0x0f) | 0x40;
              bytes[8] = (bytes[8] & 0x3f) | 0x80;
              var hex = Array.from(bytes, function (b) {
                return b.toString(16).padStart(2, "0");
              }).join("");
              return (
                hex.slice(0, 8) +
                "-" +
                hex.slice(8, 12) +
                "-" +
                hex.slice(12, 16) +
                "-" +
                hex.slice(16, 20) +
                "-" +
                hex.slice(20)
              );
            };
          })();
        `}
      </Script>
      <Script
        id="telegram-widget"
        src="https://telegram.org/js/telegram-widget.js?22"
      />

      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-G64CF421WK"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-G64CF421WK');
        `}
      </Script>
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
