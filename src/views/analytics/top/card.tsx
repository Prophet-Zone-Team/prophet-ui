import type { ReactNode } from "react";

import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";

export type TopAnalyticsCardProps = {
  categoryLabel: string;
  teamCode: string;
  teamName: string;
  description: string;
  icon: ReactNode;
  className?: string;
  ariaLabel?: string;
};

export type TopAnalyticsCardContent = Omit<
  TopAnalyticsCardProps,
  "icon" | "className" | "ariaLabel"
> & {
  iconKey?: string;
};

export function TopAnalyticsCard({
  categoryLabel,
  teamCode,
  teamName,
  description,
  icon,
  className,
  ariaLabel
}: TopAnalyticsCardProps) {
  const resolvedAriaLabel =
    ariaLabel ?? `${categoryLabel}: ${teamName}. ${description}`;

  return (
    <article
      className={cn(
        "box-border flex flex-col md:flex-row md:h-[145px] items-center gap-4 md:gap-[20px] rounded-[12px]",
        "border border-[#EBEBEB] bg-white px-3 md:px-[20px] py-3 md:py-0",
        className
      )}
      aria-label={resolvedAriaLabel}
    >
      <div className="flex size-[50px] shrink-0 items-center justify-center">
        {icon}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="m-0 text-[14px] font-[400] capitalize leading-[17px] text-[#909090] h-[34px] md:h-auto">
          {categoryLabel}
        </p>

        <div className="mt-[10px] flex items-center gap-2">
          <TeamFlag
            code={teamCode}
            name={teamName}
            className="h-[26px] w-[26px] shrink-0 rounded-[6px] text-[26px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
          />
          <h3 className="m-0 truncate text-base md:text-[20px] font-[500] leading-[24px] text-black">
            {teamName}
          </h3>
        </div>

        <p className="m-0 mt-[10px] max-w-[226px] text-[14px] font-[400] leading-[17px] text-black">
          {description}
        </p>
      </div>
    </article>
  );
}
