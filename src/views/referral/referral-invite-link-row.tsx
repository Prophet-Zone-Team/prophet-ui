"use client";

import { useTranslations } from "next-intl";

import { CopyIcon } from "@/components/icons";
import { CopiedToast } from "@/components/feedback/copied-toast";
import { useCopyWithToast } from "@/hooks/use-copy-with-toast";
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
  const t = useTranslations("referral");
  const { copiedVisible, copy } = useCopyWithToast();
  const displayLink = fullLink.replace(/^https?:\/\//, "");

  return (
    <div className={cn("relative", inviteLinkRowShellClass, className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="shrink-0 text-[14px] leading-[normal] text-[#909090]">
          {referralCode ? t("referralLink") : t("inviteLink")}
        </span>
        <div className="flex min-w-0 items-center gap-1.5 flex-1">
          <p className="flex flex-1 flex-nowrap items-center truncate text-[16px] leading-[normal] text-black">
            {referralCode ? (
              <>
                <span className="w-0 flex-1 overflow-hidden text-ellipsis text-[#909090] text-right">
                  {linkPrefix.replace(/\?r\=$/, "")}
                </span>
                <span className="shrink-0 text-[#909090]">?r=</span>
                <span className="shrink-0">{referralCode}</span>
              </>
            ) : (
              <span className="w-0 flex-1 overflow-hidden text-ellipsis text-[#909090]">
                {displayLink}
              </span>
            )}
          </p>
          <button
            type="button"
            className="inline-flex shrink-0 items-center justify-center p-1 text-[#909090] transition-opacity hover:opacity-70"
            aria-label={t("copyReferralLink")}
            onClick={() => void copy(fullLink)}
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
