"use client";

import { CopyIcon } from "@/components/icons";
import { CopiedToast } from "@/components/feedback/copied-toast";
import { useCopyWithToast } from "@/hooks/use-copy-with-toast";
import { cn } from "@/lib/cn";

export type ReferralLinkCopyProps = {
  linkPrefix: string;
  referralCode: string;
  fullLink: string;
  className?: string;
};

export function ReferralLinkCopy({
  linkPrefix,
  referralCode,
  fullLink,
  className,
}: ReferralLinkCopyProps) {
  const { copiedVisible, copy } = useCopyWithToast();

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] leading-[normal] text-[#909090] shrink-0">Referral Link</p>
        </div>
        <div className="flex items-center gap-1.5 flex-1 w-0 whitespace-nowrap">
          <p className="truncate text-[16px] leading-[normal] text-black flex items-center flex-nowrap flex-1">
            <span className="text-[#909090] flex-1 w-0 overflow-hidden text-ellipsis">
              {linkPrefix.replace(/\?r\=$/, "")}
            </span>
            <span className="text-[#909090] shrink-0">?r=</span>
            <span className="shrink-0">{referralCode}</span>
          </p>
          <button
            type="button"
            className="inline-flex shrink-0 items-center justify-center p-1 text-[#909090] transition-opacity hover:opacity-70"
            aria-label="Copy referral link"
            onClick={() => void copy(fullLink)}
          >
            <CopyIcon />
          </button>
        </div>
      </div>

      <CopiedToast
        visible={copiedVisible}
        className="absolute right-0 top-0 z-10 -translate-y-[calc(100%+8px)]"
      />
    </div>
  );
}
