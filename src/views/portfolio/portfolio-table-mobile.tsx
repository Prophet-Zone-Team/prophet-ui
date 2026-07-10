import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import {
  portfolioTableMobileLabelClass,
  portfolioTableMobileValueClass
} from "@/views/portfolio/portfolio-ui";

export function PortfolioTableMobileField({
  label,
  children,
  labelClassName,
  valueClassName,
  inline = false
}: {
  label: string;
  children: ReactNode;
  labelClassName?: string;
  valueClassName?: string;
  inline?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex",
        inline ? "items-center gap-2" : "items-start justify-between gap-3"
      )}
    >
      <span className={cn(portfolioTableMobileLabelClass, labelClassName)}>
        {label}
      </span>
      <div className={cn(portfolioTableMobileValueClass, valueClassName)}>
        {children}
      </div>
    </div>
  );
}
