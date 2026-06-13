import { formatListProbability } from "@/components/home/market-formatters";
import { cn } from "@/lib/cn";

export function AdvancingProbabilityPill({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[36px] min-w-[100px] items-center justify-center rounded-[8px] bg-[#18110F] px-2 text-[14px] font-medium leading-normal text-white",
        className,
      )}
    >
      {formatListProbability(value)}
    </span>
  );
}
