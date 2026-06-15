"use client";

import { type ReactNode } from "react";

import { HomeHero } from "@/views/home/header";
import { HomeSectionNav } from "@/views/home/home-section-nav";

export interface HomePageShellProps {
  children: ReactNode;
}

export function HomePageShell({ children }: HomePageShellProps) {
  return (
    <section className="mx-auto max-w-[1112px]">
      <HomeHero />

      <div className="w-full flex justify-center md:justify-between items-center">
        <HomeSectionNav />
      </div>

      <div role="tabpanel">{children}</div>
    </section>
  );  
}
