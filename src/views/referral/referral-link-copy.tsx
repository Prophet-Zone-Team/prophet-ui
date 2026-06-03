"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CopyIcon } from "@/components/icons";
import { CopiedToast } from "@/components/feedback/copied-toast";
import { cn } from "@/lib/cn";

const COPIED_VISIBLE_MS = 2000;

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
  const [copiedVisible, setCopiedVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullLink);
      setCopiedVisible(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setCopiedVisible(false);
      }, COPIED_VISIBLE_MS);
    } catch {
      // Clipboard unavailable; no user-facing error per plan.
    }
  }, [fullLink]);

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] leading-[normal] text-[#909090]">Referral Link</p>
        </div>
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[16px] leading-[normal] text-black">
            <span className="text-[#909090]">{linkPrefix}</span>
            <span>{referralCode}</span>
          </p>
          <button
            type="button"
            className="inline-flex shrink-0 items-center justify-center p-1 text-[#909090] transition-opacity hover:opacity-70"
            aria-label="Copy referral link"
            onClick={() => void handleCopy()}
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
