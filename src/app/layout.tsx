import type { ReactNode } from "react";

import "./globals.css";

export const metadata = {
  title: "World Cup Prediction Terminal",
  description: "A World Cup prediction market data terminal with user-owned Polymarket order tooling.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
