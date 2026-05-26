import { cn } from "@/lib/cn";
import type { ScheduleRowVariant } from "@/lib/market/schedule-match";

const STATUS_CONFIG: Record<
  ScheduleRowVariant,
  { label: string; textClass: string; dotClass: string }
> = {
  ongoing: {
    label: "ongoing",
    textClass: "text-[#7BCA25]",
    dotClass: "bg-[#7BCA25]"
  },
  upcoming: {
    label: "upcoming",
    textClass: "text-[#9D84FF]",
    dotClass: "bg-[#9D84FF]"
  },
  ended: {
    label: "ended",
    textClass: "text-[#909090]",
    dotClass: "bg-[#909090]"
  }
};

const ONGOING_DOT_SIZE = {
  sm: { className: "size-[9px]", px: 9 },
  md: { className: "size-[14px]", px: 14 }
} as const;



const ONGOING_HALO_OFFSET = 6;

export interface MatchStatusBadgeProps {
  variant: ScheduleRowVariant;
  size?: "sm" | "md";
  className?: string;
}

function OngoingStatusDot({ size }: { size: "sm" | "md" }) {
  const { className: dotClassName, px: dotPx } = ONGOING_DOT_SIZE[size];
  const haloPx = dotPx + ONGOING_HALO_OFFSET;

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: haloPx, height: haloPx }}
      aria-hidden
    >
      <span
        className={cn(
          "absolute inset-0 rounded-full bg-[#7BCA254D] animate-match-status-pulse"
        )}
      />
      <span
        className={cn("relative z-[1] rounded-full bg-[#7BCA25]", dotClassName)}
      />
    </span>
  );
}

function StaticStatusDot({
  dotClass,
  size
}: {
  dotClass: string;
  size: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full",
        ONGOING_DOT_SIZE[size].className,
        dotClass
      )}
      aria-hidden
    />
  );
}

export function MatchStatusBadge({
  variant,
  size = "md",
  className
}: MatchStatusBadgeProps) {
  const config = STATUS_CONFIG[variant];

  return (
    <span
      role="status"
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 text-sm font-[400] leading-[17px]",
        config.textClass,
        className
      )}
    >
      {variant === "ongoing" ? (
        <OngoingStatusDot size={size} />
      ) : (
        <StaticStatusDot dotClass={config.dotClass} size={size} />
      )}
      {config.label}
    </span>
  );
}
