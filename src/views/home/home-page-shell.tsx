"use client";

import { useMemo, useState, type ReactNode } from "react";

import { HomeHero } from "@/views/home/header";
import { HomeSectionNav } from "@/views/home/home-section-nav";
import { HomeSectionSearch } from "./home-section-search";
import { usePathname } from "next/navigation";
import { HomeProvider } from "./context";

export interface HomePageShellProps {
  children: ReactNode;
}

export function HomePageShell({ children }: HomePageShellProps) {
  return (
    <section className="mx-auto max-w-[1112px]">
      <HomeHero />

        <div className="w-full flex justify-center md:justify-between items-center">
          <HomeSectionNav />
          {
            isSearchInput && (
              <HomeSectionSearch />
            )
          }
        </div>

        <div role="tabpanel">{children}</div>
      </section>
    </HomeProvider>
  );
}
