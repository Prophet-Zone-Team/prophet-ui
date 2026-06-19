import { X } from "lucide-react";
import { formatComboPicksLabel } from "@/views/combo/combo-widget/formatters";
import { ComboLogo } from "@/views/combo/combo-widget/combo-logo";

export type PositionCardModalHeaderProps = {
  pickCount: number;
  onClose: () => void;
};

export function PositionCardModalHeader({
  pickCount,
  onClose
}: PositionCardModalHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="flex min-w-0 items-center gap-1.5">
        <ComboLogo />
        <span className="bg-[linear-gradient(270deg,#542099_0%,#8C35FF_100%)] bg-clip-text text-sm font-[600] leading-[18px] text-transparent">
          Combo
        </span>
        <span className="text-sm font-[500] leading-[18px] text-black">
          {formatComboPicksLabel(pickCount)}
        </span>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="inline-flex size-5 shrink-0 items-center justify-center text-[#909090] transition-opacity hover:opacity-70"
        aria-label="Close"
      >
        <X className="size-10" strokeWidth={1.6} aria-hidden />
      </button>
    </div>
  );
}
