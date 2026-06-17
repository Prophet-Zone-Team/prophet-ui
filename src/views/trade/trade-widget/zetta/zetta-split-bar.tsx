import { cn } from "@/lib/cn";

export type ZettaSplitBarProps = {
  yesCount: number;
  noCount: number;
  className?: string;
};

export function ZettaSplitBar({
  yesCount,
  noCount,
  className
}: ZettaSplitBarProps) {
  const total = yesCount + noCount;
  const yesPercent = total > 0 ? (yesCount / total) * 100 : 50;
  const isEmpty = total === 0;

  return (
    <div
      className={cn(
        "relative h-[6px] flex-1 overflow-hidden rounded-full",
        className
      )}
      role="presentation"
    >
      <div
        className={cn(
          "absolute inset-0",
          isEmpty ? "bg-[#D9D9D9]" : "bg-[#F5A898]"
        )}
      />
      <div
        className={cn(
          "absolute inset-y-0 left-0",
          isEmpty ? "bg-[#D9D9D9]" : "bg-[#B5DE99]"
        )}
        style={{
          width: `${yesPercent}%`,
          clipPath:
            yesPercent > 0 && yesPercent < 100
              ? "polygon(0 0, 100% 0, calc(100% - 4px) 100%, 0 100%)"
              : undefined
        }}
      />
    </div>
  );
}
