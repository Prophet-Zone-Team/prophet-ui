"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { MobileBottomNav } from "@/components/mb/nav/mobile-bottom-nav";
import { AppHeader } from "@/layout/header";
import { shouldHideMobileBottomNav } from "@/layout/header/nav";
import { cn } from "@/lib/cn";
import AppFooter from "./footer";

interface AppChromeProps {
  children: ReactNode;
}

export function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const hideMobileBottomNav = shouldHideMobileBottomNav(pathname);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div
        className={cn(
          "flex-1 pt-[60px] md:pt-[70px] md:pb-0",
          hideMobileBottomNav ? "pb-0" : "pb-[74px]"
        )}
      >
        {children}
      </div>
      <AppFooter className="hidden md:grid" />
      <MobileBottomNav />
    </div>
  );
}
