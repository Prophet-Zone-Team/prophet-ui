"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CopyIcon } from "@/components/icons";
import { CopiedToast } from "@/components/feedback/copied-toast";
import { COPIED_TOAST_VISIBLE_MS } from "@/lib/referral/config";
import { copyReferralLink } from "@/lib/referral/copy-referral-link";
import { cn } from "@/lib/cn";

import { inviteLinkRowShellClass } from "./referral-ui";

export type ReferralInviteLinkRowProps = {
  linkPrefix: string;
  referralCode: string;
  fullLink: string;
  className?: string;
};

export function ReferralInviteLinkRow({
  linkPrefix,
  referralCode,
  fullLink,
  className,
}: ReferralInviteLinkRowProps) {
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
    const ok = await copyReferralLink(fullLink);
    if (!ok) {
      return;
    }

    setCopiedVisible(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setCopiedVisible(false);
    }, COPIED_TOAST_VISIBLE_MS);
  }, [fullLink]);

  return (
    <div className={cn("relative", inviteLinkRowShellClass, className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="shrink-0 text-[14px] leading-[normal] text-[#909090]">
          Referral Link
        </span>
        <div className="flex min-w-0 items-center gap-1.5">
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
        className="absolute right-4 top-0 z-10 -translate-y-[calc(100%+8px)]"
      />
    </div>
  );
}
