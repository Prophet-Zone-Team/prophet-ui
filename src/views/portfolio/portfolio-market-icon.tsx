"use client";

import { useState } from "react";

import { ProphetMarkIcon } from "@/components/icons/prophet-mark-icon";
import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import type { PortfolioMarketIcon } from "@/lib/portfolio/teams-condition";

const defaultFlagClassName = "!h-5 !w-5 shrink-0 rounded-[2px] object-cover";

function PortfolioDrawIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] bg-prophet-line shadow-[0_0_2px_rgba(0,0,0,0.2)]",
        className,
      )}
      aria-hidden
    >
      <div className="flex flex-col gap-[2px]">
        <span className="block h-[1.5px] w-3 rounded-full bg-prophet-foreground" />
        <span className="block h-[1.5px] w-3 rounded-full bg-prophet-foreground" />
      </div>
    </div>
  );
}

export type PortfolioMarketIconViewProps = {
  icon: PortfolioMarketIcon;
  className?: string;
  flagClassName?: string;
  fallbackOnError?: boolean;
};

function PortfolioMarketImageIcon({
  src,
  className,
  fallbackOnError,
}: {
  src: string;
  className?: string;
  fallbackOnError?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed && fallbackOnError) {
    return (
      <ProphetMarkIcon
        className={cn("shrink-0 rounded-[2px] object-cover", className)}
        aria-hidden="true"
      />
    );
  }

  return (
    <img
      src={src}
      alt=""
      crossOrigin="anonymous"
      className={cn("h-5 w-5 shrink-0 rounded-[2px] object-cover", className)}
      onError={fallbackOnError ? () => setFailed(true) : undefined}
    />
  );
}

export function PortfolioMarketIconView({
  icon,
  className,
  flagClassName = defaultFlagClassName,
  fallbackOnError = false,
}: PortfolioMarketIconViewProps) {
  switch (icon.kind) {
    case "image":
      return (
        <PortfolioMarketImageIcon
          src={icon.src}
          className={className}
          fallbackOnError={fallbackOnError}
        />
      );
    case "single":
      return (
        <TeamFlag name={icon.teamName} className={cn(flagClassName, className)} />
      );
    case "match":
      return (
        <div className={cn("flex w-7 shrink-0 items-center", className)} aria-hidden>
          <TeamFlag
            name={icon.homeName}
            className={cn(flagClassName, "relative z-[1] -mt-2")}
          />
          <TeamFlag
            name={icon.awayName}
            className={cn(flagClassName, "relative -ml-3 mt-2")}
          />
        </div>
      );
    case "draw":
      return <PortfolioDrawIcon className={className} />;
    case "placeholder":
      return (
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full bg-prophet-line text-[10px] text-prophet-muted",
            className,
          )}
          aria-hidden="true"
        >
          ?
        </span>
      );
  }
}
