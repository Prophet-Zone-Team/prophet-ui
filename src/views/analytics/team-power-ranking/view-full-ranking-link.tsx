import { cn } from "@/lib/cn";

export type ViewFullRankingLinkProps = {
  onClick: () => void;
  className?: string;
};

export function ViewFullRankingLink({
  onClick,
  className
}: ViewFullRankingLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-[7px] border-0 bg-transparent p-0",
        "text-[14px] font-[300] leading-[17px] text-[#3168FF]",
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
      >
        <path
          d="M0.799805 0.800781L4.7998 5.19301L0.799805 9.80078"
          stroke="#3168FF"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
