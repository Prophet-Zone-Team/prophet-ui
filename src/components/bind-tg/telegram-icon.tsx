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
      xmlns="http://www.w3.org/2000/svg"
      width="27"
      height="23"
      viewBox="0 0 27 23"
      fill="none"
      className={className}
    >
      <path
        d="M26.9231 2.09385L22.8486 21.6116C22.5412 22.9891 21.7396 23.332 20.6004 22.683L14.3923 18.0362L11.3967 20.9627C11.0652 21.2994 10.7879 21.581 10.149 21.581L10.595 15.1588L22.1012 4.59785C22.6015 4.14481 21.9927 3.89379 21.3237 4.34684L7.0992 13.4445L0.975442 11.4976C-0.356596 11.0752 -0.380706 10.1446 1.2527 9.49566L25.2053 0.122482C26.3143 -0.299954 27.2847 0.373494 26.9231 2.09385Z"
        fill="white"
      />
    </svg>
  );
}
