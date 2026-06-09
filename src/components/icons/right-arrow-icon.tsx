import { cn } from "@/lib/cn";
import type { IconProps } from "@/components/icons/types";

export function RightArrowIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="6"
      height="10"
      viewBox="0 0 6 10"
      fill="none"
      className={cn("h-2.5 w-1.5 shrink-0 text-prophet-muted", className)}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M0.500001 9.5L4.5 5.10777L0.5 0.500001"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  );
}
