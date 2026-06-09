import { cn } from "@/lib/cn";
import type { IconProps } from "@/components/icons/types";

export function CheckIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      className={cn("size-[11px] shrink-0", className)}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M2 5.5L4.5 8L9 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
