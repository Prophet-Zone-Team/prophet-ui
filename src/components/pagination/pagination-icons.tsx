import { cn } from "@/lib/cn";
import type { IconProps } from "@/components/icons/types";

function ChevronIcon({
  className,
  direction,
  ...props
}: IconProps & { direction: "left" | "right" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="6"
      height="10"
      viewBox="0 0 6 10"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden="true"
      {...props}
    >
      <path
        d={direction === "right" ? "M0.500001 9.5L4.5 5.10777L0.5 0.500001" : "M4.66894 9.5L0.668946 5.10777L4.66895 0.500001"}
        stroke="#909090"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DoubleChevronIcon({
  className,
  direction,
  ...props
}: IconProps & { direction: "left" | "right" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="8"
      height="11"
      viewBox="0 0 8 11"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden="true"
      {...props}
    >
      <path
        d={direction === "right" ? "M0.5 9.5L4.5 5.10777L0.499999 0.500001M7.5 0.500001L7.5 10" : "M7.5 9.5L3.5 5.10777L7.5 0.500001M0.500001 0.500001L0.500001 10"}
        stroke="#909090"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PaginationFirstIcon({ className }: IconProps) {
  return (
    <DoubleChevronIcon direction="left" className={className} />
  );
}

export function PaginationPreviousIcon({ className }: IconProps) {
  return <ChevronIcon direction="left" className={className} />;
}

export function PaginationNextIcon({ className }: IconProps) {
  return <ChevronIcon direction="right" className={className} />;
}

export function PaginationLastIcon({ className }: IconProps) {
  return (
    <DoubleChevronIcon direction="right" className={className} />
  );
}
