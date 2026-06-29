import { cn } from "@/lib/cn";

export interface LatestEmptyStateProps {
  className?: string;
}

export function LatestEmptyState({ className }: LatestEmptyStateProps) {
  return (
    <div className={cn(className)}>
      <p className="text-center text-[16px] leading-5 text-[#909090]">
        No recent trades yet
      </p>
    </div>
  );
}
