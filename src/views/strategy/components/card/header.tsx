import { useId } from "react";

import { cn } from "@/lib/cn";

import type { StrategyCardVariant } from "./types";

const VARIANT_GRADIENT: Record<
  StrategyCardVariant,
  { from: string; to: string }
> = {
  available: { from: "#000000", to: "#666666" },
  winner: { from: "#65AF14", to: "#2A4908" },
  loss: { from: "#FF674B", to: "#993E2D" }
};

export type StrategyCardHeaderProps = {
  variant: StrategyCardVariant;
  title: string;
  className?: string;
};

export function StrategyCardHeader({
  variant,
  title,
  className
}: StrategyCardHeaderProps) {
  const uid = useId();
  const gradientId = `strategy-card-gradient${uid}`;
  const { from, to } = VARIANT_GRADIENT[variant];

  return (
    <header className={cn("relative h-[50px] w-[420px] shrink-0", className)}>
      <StrategyCardHeaderBackground
        gradientId={gradientId}
        from={from}
        to={to}
      />
      <h3 className="relative z-10 m-0 flex h-full w-full pr-[30px] items-center justify-center px-4 font-[Sora] text-[18px] font-semibold capitalize leading-normal text-white">
        {title}
      </h3>
    </header>
  );
}

function StrategyCardHeaderBackground({
  gradientId,
  from,
  to
}: {
  gradientId: string;
  from: string;
  to: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 420 50"
      fill="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M0 12C0 5.37258 5.37258 0 12 0L383.206 0C387.421 0 391.327 2.21159 393.496 5.82605L420 50H0V12Z"
        fill={`url(#${gradientId})`}
      />
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="25"
          x2="430"
          y2="25"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
    </svg>
  );
}
