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
          "font-[556] capitalize text-black",
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
        <p className="truncate text-xl font-[556] capitalize leading-6 text-black">
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
      className="inline-flex h-[29px] shrink-0 items-center justify-center rounded-[6px] px-2 text-sm font-[556] leading-[17px]"
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
  trackColor
}: {
  segments: ProbabilitySegment[];
  trackColor: string;
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
      className="relative h-5 w-full overflow-hidden rounded-[10px]"
      style={{ backgroundColor: trackColor }}
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
        "flex h-[58px] w-full items-center justify-center rounded-[12px] border-0 text-xl font-[556] leading-6 text-white transition-opacity",
        onClick ? "cursor-pointer" : "cursor-default",
        active ? "opacity-100" : "opacity-70 hover:opacity-85"
      )}
      style={{ backgroundColor: background }}
    >
      {label}
    </button>
  );
}
