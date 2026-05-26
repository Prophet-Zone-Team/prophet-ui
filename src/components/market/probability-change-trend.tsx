import { cn } from "@/lib/cn";
import { formatChangePercentMagnitude } from "@/components/home/market-formatters";

export interface ProbabilityChangeTrendProps {
  changePercent: number;
  className?: string;
  decimals?: number;
}

export function ProbabilityChangeTrend({
  changePercent,
  className,
  decimals = 0
}: ProbabilityChangeTrendProps) {
  const isDown = changePercent < 0;
  const trendColor = isDown ? "text-prophet-red" : "text-[#65AF14]";

  return (
    <span
      className={cn("inline-flex items-center gap-0.5", trendColor, className)}
    >
      <ProbabilityChangeTrendArrow isDown={isDown} />
      <span className="text-[14px] font-[556] leading-[17px]">
        {formatChangePercentMagnitude(changePercent, decimals)}
      </span>
    </span>
  );
}

function ProbabilityChangeTrendArrow({ isDown }: { isDown: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="9"
      viewBox="0 0 10 9"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.03241 0.5C4.41731 -0.166667 5.37956 -0.166667 5.76446 0.5L9.66158 7.25C10.0465 7.91667 9.56535 8.75 8.79555 8.75H1.00132C0.231523 8.75 -0.249602 7.91667 0.135298 7.25L4.03241 0.5Z"
        fill={isDown ? "#FF674B" : "#65AF14"}
      />
    </svg>
  );
}
