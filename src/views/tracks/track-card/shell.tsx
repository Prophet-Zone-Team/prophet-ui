import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type TrackCardShellProps = {
  ariaLabel: string;
  header: ReactNode;
  footer?: ReactNode;
  className?: string;
  headerClassName?: string;
};

export function TrackCardShell({
  ariaLabel,
  header,
  footer,
  className,
  headerClassName
}: TrackCardShellProps) {
  return (
    <article
      className={cn(
        "flex w-full max-w-none flex-col overflow-hidden rounded-[12px] border border-prophet-line bg-prophet-panel md:max-w-[1260px]",
        className
      )}
      aria-label={ariaLabel}
    >
      <div
        className={cn(
          "flex min-h-0 flex-col gap-3 px-3 py-3 md:min-h-[78px] md:flex-row md:flex-nowrap md:items-center md:gap-6 md:px-4",
          headerClassName
        )}
      >
        {header}
      </div>
      {footer != null ? (
        <div className="flex min-h-0 flex-col gap-3 border-t border-prophet-line bg-prophet-panel px-3 py-3 md:min-h-[60px] md:flex-row md:flex-nowrap md:items-center md:gap-6 md:px-4">
          {footer}
        </div>
      ) : null}
    </article>
  );
}
