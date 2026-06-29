import { cn } from "@/lib/cn";

export interface TracksTableHeaderProps {
  className?: string;
}

export function TracksTableHeader({ className }: TracksTableHeaderProps) {
  return (
    <div
      role="row"
      className={cn(
        "flex items-center justify-between text-[12px] leading-[15px] text-[#909090]",
        className
      )}
    >
      <span role="columnheader">Player</span>
      <span role="columnheader">24h PnL</span>
    </div>
  );
}
