"use client";

import { cn } from "@/lib/cn";

interface TelegramIconProps {
  variant?: "default" | "glow";
  className?: string;
}

export function TelegramIcon({ variant = "default", className }: TelegramIconProps) {
  if (variant === "glow") {
    return (
      <div
        className={cn(
          "flex size-[72px] items-center justify-center rounded-[16px]",
          "bg-[#E8F4FC] shadow-[0_0_0_8px_rgba(41,171,226,0.12)]",
          className
        )}
        aria-hidden="true"
      >
        <TelegramMark className="size-[40px]" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex size-[44px] shrink-0 items-center justify-center rounded-[10px] bg-[#29ABE2]",
        className
      )}
      aria-hidden="true"
    >
      <TelegramMark className="size-[24px]" />
    </div>
  );
}

function TelegramMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="12" fill="#29ABE2" />
      <path
        d="M5.5 11.8L17.2 7.1C17.8 6.9 18.3 7.2 18.1 8L16.4 16.4C16.2 17.3 15.7 17.5 15 17.1L11.8 14.7L10.3 16.1C10.1 16.3 9.9 16.5 9.5 16.5L9.7 13.1L15.8 8.4C16.1 8.2 15.8 8.1 15.4 8.3L8.1 12.6L4.9 11.7C4.1 11.4 4.1 10.9 5.1 10.5L5.5 11.8Z"
        fill="white"
      />
    </svg>
  );
}
