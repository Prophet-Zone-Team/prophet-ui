"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AppHeader } from "@/layout/header";

interface AppChromeProps {
  children: ReactNode;
}

function isLandingPath(pathname: string): boolean {
  return pathname === "/landing" || pathname.startsWith("/landing/");
}

export function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();

  if (isLandingPath(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      <AppHeader />
      <div className="pt-[70px]">{children}</div>
    </>
  );
}
