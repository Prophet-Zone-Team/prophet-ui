"use client";

import { cn } from "@/lib/cn";

interface SuccessIconProps {
  className?: string;
}

export function SuccessIcon({ className }: SuccessIconProps) {
  return (
    <div
      className={cn(
        "flex size-[72px] items-center justify-center rounded-full",
        "bg-[#DCFCE7] shadow-[0_0_0_8px_rgba(34,197,94,0.12)]",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex size-[48px] items-center justify-center rounded-full bg-[#22C55E]">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M6 12.5L10 16.5L18 8.5"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
