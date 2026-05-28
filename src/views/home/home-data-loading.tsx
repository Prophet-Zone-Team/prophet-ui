import { Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";

const metricLoadingClassName: Record<"probability" | "volume", string> = {
  probability: "h-[29px] w-16",
  volume: "h-[21px] w-20"
};

export function MarketListMetricLoading({
  variant,
  className
}: {
  variant: "probability" | "volume";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[#ebebeb]/80",
        metricLoadingClassName[variant],
        className
      )}
      aria-hidden="true"
    />
  );
}
