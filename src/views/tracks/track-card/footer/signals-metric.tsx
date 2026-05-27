import { cn } from "@/lib/cn";

import { trackCardLabelClassName } from "../styles";
import type { TrackCardSignalsSummary } from "../types";

export type SignalsMetricProps = {
  signals: TrackCardSignalsSummary;
  showPositiveLabel?: boolean;
  className?: string;
};

export function SignalsMetric({
  signals,
  showPositiveLabel = false,
  className
}: SignalsMetricProps) {
  const positiveCount = signals.positiveCount ?? 0;

  return (
    <div className={cn("flex shrink-0 flex-col w-[10%]", className)}>
      <div className="flex min-h-[20px] items-center gap-1">
        <span className="text-[16px] font-[400] leading-[20px] text-black">
          {signals.count}
        </span>
        {showPositiveLabel && positiveCount > 0 ? (
          <span className="text-[14px] font-[400] leading-[18px] text-[#65AF14]">
            Positive
          </span>
        ) : null}
      </div>
      <span className={trackCardLabelClassName}>Signals</span>
    </div>
  );
}
