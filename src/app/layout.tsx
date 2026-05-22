import type { ReactNode } from "react";

import { AppHeader } from "../layout/header";
import "./globals.css";

export const metadata = {
  title: "World Cup Prediction Terminal",
  description: "A World Cup prediction market data terminal with user-owned Polymarket order tooling.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="prophet-html">
          <div className="page">
            <AppHeader />
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
