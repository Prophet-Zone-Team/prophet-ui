"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

const cardClass = "overflow-hidden rounded-[12px] border border-[#EBEBEB] bg-white";

export function MoneyLineCard({
  expanded,
  header,
  position,
  expandedContent,
  footer,
  className,
}: {
  expanded: boolean;
  header: ReactNode;
  position?: ReactNode;
  expandedContent?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <article className={cn(cardClass, className)}>
      {header}
      {position}
      {expanded && expandedContent ? (
        <div className="border-t border-[#EBEBEB]">{expandedContent}</div>
      ) : null}
      {footer}
    </article>
  );
}
