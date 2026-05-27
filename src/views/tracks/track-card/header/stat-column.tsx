import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { trackCardLabelClassName } from "../styles";

export type StatColumnProps = {
  label: string;
  children: ReactNode;
  className?: string;
  valueClassName?: string;
};

export function StatColumn({
  label,
  children,
  className,
  valueClassName
}: StatColumnProps) {
  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <div className={cn("flex min-w-0 items-center gap-1", valueClassName)}>
        {children}
      </div>
      <span className={cn("mt-0.5", trackCardLabelClassName)}>{label}</span>
    </div>
  );
}
