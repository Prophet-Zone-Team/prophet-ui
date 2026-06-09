"use client";

import { cn } from "@/lib/cn";

export interface ScheduleFilterTriggerButtonProps {
  label: string;
  open: boolean;
  onClick: () => void;
  ariaHaspopup: "listbox" | "dialog";
}

export function ScheduleFilterTriggerButton({
  label,
  open,
  onClick,
  ariaHaspopup
}: ScheduleFilterTriggerButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex h-[34px] w-[80px] md:w-[98px] items-center justify-center gap-2 md:gap-[10px] rounded-[20px] border border-[#909090] bg-white font-normal leading-[19px] text-black text-sm md:text-base"
      aria-expanded={open}
      aria-haspopup={ariaHaspopup}
      onClick={onClick}
    >
      {label}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="10"
        height="6"
        viewBox="0 0 10 6"
        fill="none"
        className={cn("transition-transform", open && "rotate-180")}
      >
        <path
          d="M0.5 0.5L4.89223 4.5L9.5 0.5"
          stroke="black"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
