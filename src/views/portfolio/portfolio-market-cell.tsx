import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import {
  formatSharePrice,
  getOutcomeToneClass
} from "@/lib/portfolio/portfolio-format";
import type { PortfolioMarketIcon } from "@/lib/portfolio/teams-condition";

export interface PortfolioMarketCellProps {
  title: string;
  href?: string;
  outcome: string;
  price?: number;
  /** @deprecated Prefer `price` so cents formatting stays consistent. */
  priceLabel?: string;
  shares?: number;
  icon?: PortfolioMarketIcon;
}

const portfolioFlagClassName = "!h-5 !w-5 shrink-0 rounded-[2px] object-cover";

function PortfolioDrawIcon() {
  return (
    <div
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] bg-[#E8E8E8] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
      aria-hidden
    >
      <div className="flex flex-col gap-[2px]">
        <span className="block h-[1.5px] w-3 rounded-full bg-black" />
        <span className="block h-[1.5px] w-3 rounded-full bg-black" />
      </div>
    </div>
  );
}

function PortfolioMarketIconView({ icon }: { icon: PortfolioMarketIcon }) {
  switch (icon.kind) {
    case "single":
      return (
        <TeamFlag name={icon.teamName} className={portfolioFlagClassName} />
      );
    case "match":
      return (
        <div className="flex w-7 shrink-0 items-center" aria-hidden>
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
        <span
          className="flex size-5 shrink-0 items-center justify-center rounded-full bg-prophet-line text-[10px] text-prophet-muted"
          aria-hidden="true"
        >
          ?
        </span>
      );
  }
}

export function PortfolioMarketCell({
  title,
  href,
  outcome,
  price,
  priceLabel,
  shares,
  icon = { kind: "placeholder" }
}: PortfolioMarketCellProps) {
  const formattedPrice =
    price != null && Number.isFinite(price)
      ? formatSharePrice(price)
      : priceLabel;
  const subline = formattedPrice ? `${outcome} ${formattedPrice}` : outcome;
  const sharesLabel =
    shares != null && Number.isFinite(shares)
      ? `${shares.toFixed(1)} shares`
      : null;

  return (
    <div className="flex min-w-0 items-start gap-2">
      <PortfolioMarketIconView icon={icon} />
      <div className="min-w-0 overflow-hidden text-ellipsis">
        {href ? (
          <a
            href={href}
            className="m-0 truncate font-[500] text-black hover:underline"
          >
            {title}
          </a>
        ) : (
          <p className="m-0 truncate font-[500] text-black">{title}</p>
        )}
        {outcome ? (
          <p className={cn("m-0 mt-0.5 text-xs", getOutcomeToneClass(outcome))}>
            {subline}
            {sharesLabel ? (
              <span className="text-prophet-muted ml-1"> {sharesLabel}</span>
            ) : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}
