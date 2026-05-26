import { cn } from "@/lib/cn";

import type { SignalAllSortDirection } from "./types";

export type SignalAllSortIconProps = {
  direction: SignalAllSortDirection;
  className?: string;
};

export function SignalAllSortIcon({
  direction,
  className
}: SignalAllSortIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="9"
      height="8"
      viewBox="0 0 9 8"
      fill="none"
      className={cn(
        "shrink-0 transition-transform",
        direction === "asc" && "rotate-180",
        className
      )}
    >
      <path
        d="M3.59979 7.5C3.98469 8.16667 4.94695 8.16667 5.33185 7.5L8.79595 1.5C9.18085 0.833334 8.69972 0 7.92992 0H1.00172C0.231919 0 -0.249207 0.833333 0.135694 1.5L3.59979 7.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
