import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type SignalSummaryTagTone =
  | "neutral"
  | "positive"
  | "negative"
  | "high-impact";

const toneClassNames: Record<SignalSummaryTagTone, string> = {
  neutral: "bg-[#909090]/10",
  positive: "bg-[#7BCA25]/10",
  negative: "bg-[#FF674B]/10",
  "high-impact": "bg-[#F4B600]/10"
};

export type SignalSummaryTagProps = {
  label: string;
  count: number;
  tone: SignalSummaryTagTone;
  icon?: ReactNode;
  className?: string;
};

export function SignalSummaryTag({
  label,
  count,
  tone,
  icon,
  className
}: SignalSummaryTagProps) {
  return (
    <div
      className={cn(
        "inline-flex h-[36px] items-center gap-[8px] rounded-[8px] px-[10px]",
        toneClassNames[tone],
        className
      )}
    >
      {icon}
      <span className="whitespace-nowrap text-[16px] font-[500] leading-[19px] text-black">
        {label} {count}
      </span>
    </div>
  );
}
