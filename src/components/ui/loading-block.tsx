import { cn } from "@/lib/cn";

export function LoadingBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[#ebebeb]/80 dark:bg-[#000000]/50",
        className ?? "h-4 w-full"
      )}
      aria-hidden
    />
  );
}
