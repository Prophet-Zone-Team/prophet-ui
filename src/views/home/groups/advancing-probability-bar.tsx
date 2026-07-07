import { cn } from "@/lib/cn";

export function AdvancingProbabilityBar({
  value,
  className
}: {
  value: number;
  className?: string;
}) {
  const fillPercent = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn(
        "h-[6px] overflow-hidden rounded-[4px] bg-prophet-line w-[90%]",
        className
      )}
      role="presentation"
      aria-hidden
    >
      <div
        className="h-full rounded-[4px] bg-black"
        style={{ width: `${fillPercent}%` }}
      />
    </div>
  );
}
