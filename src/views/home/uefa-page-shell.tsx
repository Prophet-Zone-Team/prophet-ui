"use client";

import { type ReactNode } from "react";

import { UefaHero } from "@/views/home/header/uefa-hero";

export interface UefaPageShellProps {
  children: ReactNode;
}

export function UefaPageShell({ children }: UefaPageShellProps) {
  return (
    <section className="mx-auto max-w-[1112px]">
      <UefaHero />
      <div>{children}</div>
    </section>
  );
}
