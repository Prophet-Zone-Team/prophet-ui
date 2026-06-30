import { cn } from "@/lib/cn";

export type OutcomeAlign = "left" | "center" | "right";

export function OutcomeStat({
  label,
  value,
  align,
  large = false,
  changeLabel,
  changeColor
}: {
  label: string;
  value: number;
  align: OutcomeAlign;
  large?: boolean;
  changeLabel?: string;
  changeColor?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0",
        align === "left" && "text-left",
        align === "right" && "text-right",
        align === "center" && "text-center"
      )}
    >
      <p
        className={cn(
          "font-[500] capitalize text-prophet-foreground",
          large ? "text-[60px] leading-[72px]" : "text-xl leading-6"
        )}
      >
        {Math.round(value)}%
      </p>

      <div
        className={cn(
          "mt-1 flex min-w-0 items-center gap-2",
          align === "left" && "justify-start",
          align === "right" && "justify-end",
          align === "center" && "justify-center"
        )}
      >
        {changeLabel && changeColor ? (
          <ChangePill label={changeLabel} color={changeColor} />
        ) : null}
        <p className="truncate text-xl font-[500] capitalize leading-6 text-prophet-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

export function ChangePill({
  label,
  color
}: {
  label: string;
  color: string;
}) {
  return (
    <span
      className="inline-flex h-[29px] shrink-0 items-center justify-center rounded-[6px] px-2 text-sm font-[400] leading-[17px]"
      style={{
        backgroundColor: `${color}33`,
        color
      }}
    >
      {label}
    </span>
  );
}

export type ProbabilitySegment = {
  value: number;
  color: string;
};

export function ProbabilityBar({
  segments,
  trackColor,
  height = 12
}: {
  segments: ProbabilitySegment[];
  trackColor: string;
  height?: number;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const positionedSegments = segments.reduce<
    Array<ProbabilitySegment & { left: number; width: number }>
  >((items, segment) => {
    const width = (segment.value / total) * 100;
    const left = items.reduce((sum, item) => sum + item.width, 0);

    items.push({ ...segment, left, width });
    return items;
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: trackColor,
        height: `${height}px`,
        borderRadius: `${Math.min(height / 2, 10)}px`
      }}
      aria-hidden
    >
      {positionedSegments.map((segment, index) => (
        <div
          key={index}
          className="absolute inset-y-0"
          style={{
            left: `${segment.left}%`,
            width: `${segment.width}%`,
            backgroundColor: segment.color
          }}
        />
      ))}
    </div>
  );
}

export function BidButton({
  label,
  background,
  active = false,
  onClick
}: {
  label: string;
  background: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-[58px] w-full items-center justify-center rounded-[12px] border-0 text-xl font-[500] leading-6 text-white transition-opacity",
        onClick ? "cursor-pointer" : "cursor-default",
        active ? "opacity-100" : "opacity-70 hover:opacity-85"
      )}
      style={{ backgroundColor: background }}
    >
      {label}
    </button>
  );
}
