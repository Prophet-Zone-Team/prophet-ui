import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

export const panelClassName =
  "rounded-[12px] border border-[#EBEBEB] bg-white p-[20px]";

export function Panel({
  className,
  children,
  ...props
}: ComponentProps<"section">) {
  return (
    <section className={cn(panelClassName, className)} {...props}>
      {children}
    </section>
  );
}
