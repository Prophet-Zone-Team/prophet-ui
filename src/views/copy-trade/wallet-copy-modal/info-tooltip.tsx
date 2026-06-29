"use client";

import type { ReactNode } from "react";

import Popover from "@/components/popover";
import { cn } from "@/lib/cn";

export function CopyTradeInfoIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="6.2" stroke="#909090" strokeWidth="1.2" />
      <path
        d="M7 6.2V10"
        stroke="#909090"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="7" cy="4.3" r="0.75" fill="#909090" />
    </svg>
  );
}

interface CopyTradeInfoTooltipProps {
  content: ReactNode;
  placement?: "Top" | "TopLeft" | "TopRight";
  className?: string;
}

export function CopyTradeInfoTooltip({
  content,
  placement = "TopLeft",
  className
}: CopyTradeInfoTooltipProps) {
  return (
    <Popover
      placement={placement}
      trigger="Hover"
      offset={8}
      contentClassName="z-[70]"
      content={
        <div className="max-w-[377px] rounded-xl border border-[#EBEBEB] bg-white px-4 py-3 text-sm leading-[150%] text-black shadow-[0px_0px_10px_rgba(0,0,0,0.1)]">
          {content}
        </div>
      }
    >
      <button
        type="button"
        className={cn(
          "inline-flex shrink-0 items-center justify-center border-0 bg-transparent p-0",
          "cursor-default text-[#909090] transition-opacity hover:opacity-70",
          className
        )}
        aria-label="More information"
        tabIndex={-1}
      >
        <CopyTradeInfoIcon />
      </button>
    </Popover>
  );
}
