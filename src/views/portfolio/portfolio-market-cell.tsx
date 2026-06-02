import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import { getOutcomeToneClass } from "@/lib/portfolio/portfolio-format";
import type { TeamMarketSnapshot } from "@/types/market";

export interface PortfolioMarketCellProps {
  title: string;
  href?: string;
  outcome: string;
  priceLabel?: string;
  snapshot?: TeamMarketSnapshot;
}

export function PortfolioMarketCell({
  title,
  href,
  outcome,
  priceLabel,
  snapshot
}: PortfolioMarketCellProps) {
  const subline = priceLabel ? `${outcome} ${priceLabel}` : outcome;

  return (
    <div className="flex min-w-0 items-start gap-2">
      {snapshot ? (
        <TeamFlag code={snapshot.team.code} name={snapshot.team.name} />
      ) : (
        <span
          className="flex size-5 shrink-0 items-center justify-center rounded-full bg-prophet-line text-[10px] text-prophet-muted"
          aria-hidden="true"
        >
          ?
        </span>
      )}
      <div className="min-w-0 overflow-hidden text-ellipsis">
        {href ? (
          <a
            href={href}
            className="m-0 truncate font-[556] text-black hover:underline"
          >
            {title}
          </a>
        ) : (
          <p className="m-0 truncate font-[556] text-black">{title}</p>
        )}
        {outcome ? (
          <p
            className={cn(
              "m-0 mt-0.5 text-xs",
              getOutcomeToneClass(outcome)
            )}
          >
            {subline}
          </p>
        ) : null}
      </div>
    </div>
  );
}
