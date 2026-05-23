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
  let offset = 0;

  return (
    <div
      className="relative h-5 w-full overflow-hidden rounded-[10px]"
      style={{ backgroundColor: trackColor }}
      aria-hidden
    >
      {segments.map((segment, index) => {
        const width = (segment.value / total) * 100;
        const left = offset;
        offset += width;

        return (
          <div
            key={index}
            className="absolute inset-y-0"
            style={{
              left: `${left}%`,
              width: `${width}%`,
              backgroundColor: segment.color
            }}
          />
        );
      })}
    </div>
  );
}

export function BidButton({
  label,
  background
}: {
  label: string;
  background: string;
}) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      className="flex h-[58px] w-full cursor-default items-center justify-center rounded-[12px] border-0 text-xl font-[556] leading-6 text-white opacity-100"
      style={{ backgroundColor: background }}
    >
      {label}
    </button>
  );
}
