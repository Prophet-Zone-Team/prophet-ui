"use client";

import type { ReactNode } from "react";

import { MobileBottomNav } from "@/components/mb/nav/mobile-bottom-nav";
import { AppHeader } from "@/layout/header";
import AppFooter from "./footer";

interface AppChromeProps {
  children: ReactNode;
}

export function AppChrome({ children }: AppChromeProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex-1 pb-[74px] pt-[70px] md:pb-0">{children}</div>
      <AppFooter className="hidden md:grid" />
      <MobileBottomNav />
    </div>
  );
}
