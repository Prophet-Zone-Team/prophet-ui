"use client";

import { type ReactNode } from "react";

import { HomeHero } from "@/views/home/header";
import { HomeSectionNav } from "@/views/home/home-section-nav";
import { ComboEntry } from "@/views/combo/combo-entry";

export interface HomePageShellProps {
  children: ReactNode;
}

export function HomePageShell({ children }: HomePageShellProps) {
  return (
    <section className="mx-auto max-w-[1112px]">
      <HomeHero />

      <div className="w-full flex justify-between md:justify-between items-center">
        <HomeSectionNav />
        <div className="pb-[10px]">
          <ComboEntry className="h-[34px] w-[171px] rounded-[17px]" />
        </div>
      </div>

      <div role="tabpanel">{children}</div>
    </section>
  );
}
