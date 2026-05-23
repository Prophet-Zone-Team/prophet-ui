import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/auth";
import { AppHeader } from "@/layout/header";
import "flag-icons/css/flag-icons.min.css";
import "@/app/globals.css";

export const metadata = {
  title: "World Cup Prediction Terminal",
  description:
    "A World Cup prediction market data terminal with user-owned Polymarket order tooling.",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg"
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <main className="min-h-screen overflow-x-hidden font-body">
            <AppHeader />
            <div className="pt-11">{children}</div>
          </main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
