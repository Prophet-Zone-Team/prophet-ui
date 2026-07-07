import type { ReactNode } from "react";
import type { Viewport } from "next";
import { cookies, headers } from "next/headers";
import { getMessages } from "next-intl/server";

import { AppRoot } from "@/components/runtime/app-root";
import "@/app/globals.css";
import { Metadata } from "@/context/rainbowkit/metadata";
import { LOCALE_COOKIE, resolveLocale } from "@/i18n/config";
import { isSecureFromHeaders } from "@/lib/runtime/is-secure-app-context";
import Script from "next/script";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

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
  const requestHeaders = await headers();
  const cookieStore = await cookies();
  const cookie = requestHeaders.get("cookie");
  const initialSecure = isSecureFromHeaders(requestHeaders);
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <meta name="twitter:site" content="@prophet" />
        <meta name="twitter:card" content="summary_large_image"></meta>
        <meta name="twitter:title" content="Prophet"></meta>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var raw = localStorage.getItem("wc-user-config");
                if (!raw) return;
                var parsed = JSON.parse(raw);
                if (parsed && parsed.state && parsed.state.darkModeEnabled) {
                  document.documentElement.classList.add("dark");
                }
              } catch (e) {}
            })();
          `}
        </Script>
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
      </head>
      <body className="flex min-h-dvh flex-col bg-prophet-base text-prophet-foreground">
        <AppRoot
          initialSecure={initialSecure}
          cookie={cookie}
          initialLocale={locale}
          initialMessages={messages}
        >
          {children}
        </AppRoot>
        <Script
          id="telegram-widget"
          src="https://telegram.org/js/telegram-widget.js?22"
          strategy="lazyOnload"
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
            gtag('config', 'G-61KQ9XX9HM');
          `}
        </Script>
      </body>
    </html>
  );
}
