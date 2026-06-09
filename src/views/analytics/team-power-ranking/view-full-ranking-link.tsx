import Link from "next/link";

import { cn } from "@/lib/cn";

export type ViewFullRankingLinkProps = {
  href?: string;
  className?: string;
};

export function ViewFullRankingLink({
  href = "/team-power-ranking",
  className
}: ViewFullRankingLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1 md:gap-[7px] border-0 bg-transparent p-0",
        "text-xs md:text-[14px] font-[400] leading-[17px] text-[#3168FF]",
        "cursor-pointer transition-opacity hover:opacity-80",
        className
      )}
    >
      <span>View Full Ranking</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="6"
        height="11"
        viewBox="0 0 6 11"
        fill="none"
        aria-hidden
      >
        <path
          d="M0.799805 0.800781L4.7998 5.19301L0.799805 9.80078"
          stroke="#3168FF"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </Link>
  );
}
