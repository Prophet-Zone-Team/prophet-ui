"use client";

import type { ReactNode } from "react";

import { formatCompactVolume } from "@/lib/formatters/volume";
import { cn } from "@/lib/cn";

const cardClass = "rounded-[12px] border border-prophet-line bg-prophet-panel";

export function LineMarketCard({
  title,
  volume,
  actions,
  footer,
  className
}: {
  title: string;
  volume?: number;
  actions: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const volumeLabel = formatCompactVolume(volume);

  return (
    <article className={cn(cardClass, className)}>
      <div className="flex items-start justify-between gap-4 p-[16px]">
        <div className="min-w-0 shrink-0">
          <h3 className="m-0 text-[20px] font-[500] leading-6 text-prophet-foreground">
            {title}
          </h3>
          {volumeLabel ? (
            <p className="m-0 mt-[6px] text-[14px] font-[500] leading-[17px] text-[#909090]">
              {volumeLabel} vol.
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      </div>

      {footer ? (
        <div className="mt-4 border-t border-prophet-line pt-3">{footer}</div>
      ) : null}
    </article>
  );
}
