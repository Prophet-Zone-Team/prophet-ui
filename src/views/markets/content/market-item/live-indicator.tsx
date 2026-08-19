import { cn } from "@/lib/cn";

export function LiveIndicator({
  compact = false,
  dotOnly = false
}: {
  compact?: boolean;
  dotOnly?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="size-[10px] shrink-0 rounded-full bg-[#7BCA25] ring-[3px] ring-[rgba(123,202,37,0.3)]"
        aria-hidden
      />
      {dotOnly ? null : (
        <span
          className={cn(
            "font-[400] text-[#7BCA25]",
            compact ? "text-[14px] leading-[18px]" : "text-base leading-5"
          )}
        >
          Live
        </span>
      )}
    </span>
  );
}
