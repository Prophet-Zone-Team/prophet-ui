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
  sm: "size-[9px]",
  md: "size-[14px]"
} as const;

const STATIC_DOT_SIZE = "size-2";

export interface MatchStatusBadgeProps {
  variant: ScheduleRowVariant;
  size?: "sm" | "md";
  className?: string;
}

function OngoingStatusDot({ size }: { size: "sm" | "md" }) {
  const dotSize = ONGOING_DOT_SIZE[size];

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        dotSize
      )}
      aria-hidden
    >
      <span
        className={cn(
          "absolute inset-0 rounded-full border-[3px] border-[rgba(123,202,37,0.3)] animate-match-status-pulse"
        )}
      />
      <span
        className={cn(
          "relative rounded-full bg-[#7BCA25] animate-match-status-pulse",
          dotSize
        )}
      />
    </span>
  );
}

function StaticStatusDot({
  dotClass
}: {
  dotClass: string;
}) {
  return (
    <span
      className={cn("shrink-0 rounded-full", STATIC_DOT_SIZE, dotClass)}
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
        "inline-flex items-center gap-1.5 text-sm font-[556] leading-[17px]",
        config.textClass,
        className
      )}
    >
      {variant === "ongoing" ? (
        <OngoingStatusDot size={size} />
      ) : (
        <StaticStatusDot dotClass={config.dotClass} />
      )}
      {config.label}
    </span>
  );
}
