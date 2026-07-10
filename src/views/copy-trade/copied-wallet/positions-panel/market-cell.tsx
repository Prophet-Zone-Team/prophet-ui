"use client";

import { ProphetMarkIcon } from "@/components/icons/prophet-mark-icon";
import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import type { PortfolioMarketIcon } from "@/lib/portfolio/teams-condition";

const portfolioFlagClassName = "!h-5 !w-5 shrink-0 rounded-[2px] object-cover";

function PortfolioDrawIcon() {
  return (
    <div
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] bg-prophet-action-panel shadow-[0_0_2px_rgba(0,0,0,0.2)]"
      aria-hidden
    >
      <div className="flex flex-col gap-[2px]">
        <span className="block h-[1.5px] w-3 rounded-full bg-prophet-foreground" />
        <span className="block h-[1.5px] w-3 rounded-full bg-prophet-foreground" />
      </div>
    </div>
  );
}

function PositionMarketIcon({ icon }: { icon: PortfolioMarketIcon }) {
  switch (icon.kind) {
    case "image":
      return (
        <img
          src={icon.src}
          alt=""
          className="h-[30px] w-[30px] shrink-0 rounded-[2px] object-cover"
        />
      );
    case "single":
      return (
        <TeamFlag
          name={icon.teamName}
          className="!h-[30px] !w-[30px] shrink-0 rounded-[2px] object-cover"
        />
      );
    case "match":
      return (
        <div className="flex w-8 shrink-0 items-center" aria-hidden>
          <TeamFlag
            name={icon.homeName}
            className={cn(portfolioFlagClassName, "relative z-[1] -mt-2")}
          />
          <TeamFlag
            name={icon.awayName}
            className={cn(portfolioFlagClassName, "relative -ml-3 mt-2")}
          />
        </div>
      );
    case "draw":
      return <PortfolioDrawIcon />;
    case "placeholder":
      return (
        <ProphetMarkIcon className="size-[30px]" aria-hidden="true" />
      );
  }
}

function getOutcomeToneClass(outcome: string): string {
  const normalized = outcome.trim().toLowerCase();

  if (normalized === "yes") {
    return "text-[#65AF14]";
  }

  if (normalized === "draw") {
    return "text-prophet-muted";
  }

  if (normalized === "no") {
    return "text-[#FF674B]";
  }

  return "text-[#3168FF]";
}

export interface CopyWalletPositionMarketCellProps {
  title: string;
  href?: string;
  outcome: string;
  priceLabel: string;
  shares: number;
  icon: PortfolioMarketIcon;
}

export function CopyWalletPositionMarketCell({
  title,
  href,
  outcome,
  priceLabel,
  shares,
  icon
}: CopyWalletPositionMarketCellProps) {
  const subline = `${outcome} ${priceLabel}`;
  const sharesLabel = Number.isInteger(shares)
    ? `${shares} shares`
    : `${shares.toFixed(1)} shares`;

  return (
    <div className="flex min-w-0 items-start gap-2">
      <PositionMarketIcon icon={icon} />
      <div className="min-w-0">
        {href ? (
          <a
            href={href}
            className="block truncate text-[14px] font-[500] leading-[18px] text-prophet-foreground hover:underline"
          >
            {title}
          </a>
        ) : (
          <p className="truncate text-[14px] font-[500] leading-[18px] text-prophet-foreground">
            {title}
          </p>
        )}
        <p className="mt-0.5 truncate text-[12px] leading-[15px]">
          <span className={getOutcomeToneClass(outcome)}>{subline}</span>
          <span className="text-prophet-muted"> {sharesLabel}</span>
        </p>
      </div>
    </div>
  );
}
