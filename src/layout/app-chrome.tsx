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
    <div className="flex min-h-0 flex-1 flex-col">
      <AppHeader />
      <div
        className={cn(
          "pt-[60px] md:flex-1 md:pt-[70px] md:pb-0",
          hideMobileBottomNav
            ? "pb-0"
            : "pb-[calc(74px+env(safe-area-inset-bottom,0px))]"
        )}
      >
        {children}
      </div>
      <AppFooter className="hidden md:grid" />
      <MobileBottomNav />
    </div>
  );
}
