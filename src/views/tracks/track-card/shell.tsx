import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type TrackCardShellProps = {
  ariaLabel: string;
  header: ReactNode;
  footer: ReactNode;
  className?: string;
};

export function TrackCardShell({
  ariaLabel,
  header,
  footer,
  className
}: TrackCardShellProps) {
  return (
    <article
      className={cn(
        "flex w-full max-w-[1260px] flex-col overflow-hidden rounded-[12px] border border-[#EBEBEB] bg-white",
        className
      )}
      aria-label={ariaLabel}
    >
      <div className="flex min-h-[78px] items-center gap-6 px-4 py-3 max-lg:flex-wrap max-lg:gap-4 max-lg:py-4">
        {header}
      </div>
      <div className="flex min-h-[60px] items-center gap-6 border-t border-[#EBEBEB] bg-[#EDF0F3] px-4 py-3 max-lg:flex-wrap max-lg:gap-4">
        {footer}
      </div>
    </article>
  );
}
