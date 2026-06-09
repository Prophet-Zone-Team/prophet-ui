import { cn } from "@/lib/cn";

import { ViewMoreLink } from "./view-more-link";

export type NewsHeaderProps = {
  className?: string;
};

export function NewsHeader({ className }: NewsHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-3",
        className
      )}
    >
      <h2 className="m-0 text-[18px] font-[400] leading-[21px] text-black">
        Signal &amp; New Impact
      </h2>
      <ViewMoreLink />
    </header>
  );
}
