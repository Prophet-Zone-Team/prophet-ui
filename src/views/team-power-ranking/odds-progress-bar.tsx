import { cn } from "@/lib/cn";

export type OddsProgressBarProps = {
  value: number;
  max: number;
  className?: string;
};

export function OddsProgressBar({
  value,
  max,
  className
}: OddsProgressBarProps) {
  const fillPercent = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div
      className={cn(
        "relative h-[8px] overflow-hidden rounded-[4px] bg-[#D9D9D9]",
        className
      )}
      role="presentation"
    >
      <div
        className="absolute inset-y-0 left-0 rounded-[4px] bg-[#65AF14]"
        style={{ width: `${fillPercent}%` }}
      />
    </div>
  );
}
