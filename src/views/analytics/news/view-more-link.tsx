import { cn } from "@/lib/cn";

export type ViewMoreLinkProps = {
  className?: string;
};

export function ViewMoreLink({ className }: ViewMoreLinkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[7px] cursor-pointer transition-opacity hover:opacity-80",
        "text-[14px] font-[300] text-[#3168FF]",
        className
      )}
    >
      <span>View More</span>
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
    </span>
  );
}
