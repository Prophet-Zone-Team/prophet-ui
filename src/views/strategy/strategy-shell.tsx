"use client";

import type { ReactNode } from "react";

import { StrategyNotice } from "./notice";
import { StrategySectionNav } from "./section-nav";

export type StrategyShellProps = {
  children: ReactNode;
};

export function StrategyShell({ children }: StrategyShellProps) {
  return (
    <div className="w-full">
      <StrategyNotice />

      <section className="mx-auto w-full max-w-[1112px] px-3 pb-8 pt-4 md:px-4 md:pt-5">
        <h1 className="text-center text-[22px] font-[400] text-black md:text-[52px]">
          Bet smarter. Risk clearer.
        </h1>

        <div className="mt-4 md:mt-5">
          <StrategySectionNav />
        </div>

        <div role="tabpanel" className="mt-4 md:mt-5">
          {children}
        </div>
      </section>
    </div>
  );
}
