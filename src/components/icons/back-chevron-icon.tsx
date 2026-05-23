import { cn } from "../../lib/cn";
import type { IconProps } from "./types";

export function BackChevronIcon({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="6"
      height="10"
      viewBox="0 0 6 10"
      fill="none"
      className={cn("h-2.5 w-1.5 shrink-0", className)}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M4.66895 0.5L0.668945 4.89223L4.66895 9.5"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  );
}
