import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { comboTitleTextClass } from "@/views/combo/combo-ui";

export function MobileDrawerOddsSection({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2 px-3 py-3">
      <h3 className={cn("m-0 text-sm font-[500] leading-[18px]", comboTitleTextClass)}>{title}</h3>
      {children}
    </section>
  );
}
