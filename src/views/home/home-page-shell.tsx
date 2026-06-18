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

      <div className="flex w-full items-center justify-between">
        <HomeSectionNav />
        <div className="hidden pb-[10px] md:block">
          <ComboEntry className="h-[34px] w-[171px] rounded-[17px]" />
        </div>
      </div>

      <div role="tabpanel" className="pb-[50px] md:pb-0">
        {children}
      </div>

      <div className="fixed inset-x-0 bottom-[calc(74px+env(safe-area-inset-bottom,0px))] z-40 px-5 md:hidden">
        <ComboEntry variant="homeMobile" className="mx-auto w-[90vw]" />
      </div>
    </section>
  );
}
