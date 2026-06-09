"use client";

import type { ReactNode } from "react";

import { AppHeader } from "@/layout/header";
import AppFooter from "./footer";

interface AppChromeProps {
  children: ReactNode;
}

export function AppChrome({ children }: AppChromeProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="pt-[70px] flex-1">{children}</div>
      <AppFooter />
    </div>
  );
}
