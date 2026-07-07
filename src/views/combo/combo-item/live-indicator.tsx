import { cn } from "@/lib/cn";

export function LiveIndicator({
  compact = false,
  mobile = false
}: {
  compact?: boolean;
  mobile?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "shrink-0 rounded-full bg-[#7BCA25] ring-[2px] ring-[#7BCA254D]",
          mobile ? "size-1.5" : "size-2"
        )}
        aria-hidden
      />
      <span
        className={cn(
          "font-[400]",
          mobile
            ? "text-xs leading-[15px] text-[#65AF14]"
            : compact
              ? "text-sm leading-[18px] text-prophet-foreground"
              : "text-base leading-5 text-prophet-foreground"
        )}
      >
        Live
      </span>
    </span>
  );
}
