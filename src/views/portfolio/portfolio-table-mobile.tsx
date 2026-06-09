import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import {
  portfolioTableMobileLabelClass,
  portfolioTableMobileValueClass
} from "@/views/portfolio/portfolio-ui";

export function PortfolioTableMobileField({
  label,
  children,
  valueClassName
}: {
  label: string;
  children: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className={portfolioTableMobileLabelClass}>{label}</span>
      <div className={cn(portfolioTableMobileValueClass, valueClassName)}>
        {children}
      </div>
    </div>
  );
}
