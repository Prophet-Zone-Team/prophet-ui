import { cn } from "@/lib/cn";
import { gameColors } from "@/views/trade/game/ui";

export type FixtureOutcomeSplitVariant = "over_under" | "yes_no";

const splitVariantConfig = {
  over_under: {
    leftLabel: "O",
    rightLabel: "U",
    leftColor: gameColors.home,
    rightColor: gameColors.awayBar
  },
  yes_no: {
    leftLabel: "Y",
    rightLabel: "N",
    leftColor: "#65AF14",
    rightColor: "#FF674B"
  }
} as const;

export function FixtureOutcomeSplitIcon({
  variant,
  activeSide,
  className
}: {
  variant: FixtureOutcomeSplitVariant;
  activeSide: "left" | "right";
  className?: string;
}) {
  const config = splitVariantConfig[variant];
  const leftActive = activeSide === "left";
  const rightActive = activeSide === "right";

  return (
    <div
      className={cn(
        "relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-neutral-50 shadow-[0_0_2px_rgba(0,0,0,0.2)]",
        className
      )}
      aria-hidden
    >
      <div className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 overflow-hidden">
        <div
          className="absolute inset-0 transition-opacity"
          style={{
            backgroundColor: config.leftColor,
            clipPath: "polygon(0px 0px, 100% 0px, 0px 100%)",
            opacity: leftActive ? 1 : 0.35
          }}
        />
        <div
          className="absolute inset-0 transition-opacity"
          style={{
            backgroundColor: config.rightColor,
            clipPath: "polygon(100% 0px, 0px 100%, 100% 100%)",
            opacity: rightActive ? 1 : 0.35
          }}
        />
      </div>
      <p
        className={cn(
          "absolute left-[0px] top-[0px] z-[1] text-xs font-medium text-white transition-opacity",
          leftActive ? "opacity-100" : "opacity-90 dark:opacity-60"
        )}
      >
        {config.leftLabel}
      </p>
      <p
        className={cn(
          "absolute bottom-[0px] right-[0px] z-[1] text-xs font-medium text-white transition-opacity",
          rightActive ? "opacity-100" : "opacity-90 dark:opacity-60"
        )}
      >
        {config.rightLabel}
      </p>
    </div>
  );
}
