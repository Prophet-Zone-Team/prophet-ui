import type { ReactNode } from "react";
import { headers } from "next/headers";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/auth";
import { AppHeader } from "@/layout/header";
import "flag-icons/css/flag-icons.min.css";
import "@/app/globals.css";
import { Metadata } from "@/context/rainbowkit/metadata";
import RainbowProvider from "@/context/rainbowkit/provider";

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
      <body>
        <RainbowProvider cookie={cookie}>
          <AuthProvider>
            <main className="min-h-screen overflow-x-hidden font-body">
              <AppHeader />
              <div className="pt-[70px] bg-[#F9FAFC]">{children}</div>
            </main>
            <Toaster />
          </AuthProvider>
        </RainbowProvider>
      </body>
    </html>
  );
}
