import { cn } from "@/lib/cn";

import { ZettaSplitBar } from "./zetta-split-bar";

export type ZettaMetricRowProps = {
  icon: string;
  label: string;
  yesCount: number;
  noCount: number;
  className?: string;
};

export function ZettaMetricRow({
  icon,
  label,
  yesCount,
  noCount,
  className
}: ZettaMetricRowProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <span className="shrink-0 text-[14px] leading-none" aria-hidden>
        {icon}
      </span>
      <span className="w-[100px] text-[12px] font-[500] leading-[15px] text-prophet-foreground">
        {label}
      </span>
      <div className="ml-auto flex min-w-0 flex-1 items-center gap-2 pl-2">
        <span className="w-[14px] shrink-0 text-right text-[12px] font-[500] leading-[15px] tabular-nums text-prophet-foreground">
          {yesCount}
        </span>
        <ZettaSplitBar
          yesCount={yesCount}
          noCount={noCount}
          className="min-w-[72px]"
        />
        <span className="w-[14px] shrink-0 text-left text-[12px] font-[500] leading-[15px] tabular-nums text-prophet-foreground">
          {noCount}
        </span>
      </div>
    </div>
  );
}
