import { cn } from "@/lib/cn";

export function LiveIndicator({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="size-2 shrink-0 rounded-full bg-[#7BCA25] ring-[3px] ring-[#7BCA254D]"
        aria-hidden
      />
      <span
        className={cn(
          "font-[400] text-black",
          compact ? "text-sm leading-[18px]" : "text-base leading-5"
        )}
      >
        Live
      </span>
    </span>
  );
}
