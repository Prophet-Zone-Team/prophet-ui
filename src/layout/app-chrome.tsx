"use client";

import type { ReactNode } from "react";

import { AppHeader } from "@/layout/header";

interface AppChromeProps {
  children: ReactNode;
}

export function AppChrome({ children }: AppChromeProps) {
  return (
    <>
      <AppHeader />
      <div className="pt-[70px]">{children}</div>
    </>
  );
}
