"use client";

import { forwardRef, useImperativeHandle, type RefObject } from "react";
import { useTranslations } from "next-intl";

import { CopiedToast } from "@/components/feedback/copied-toast";
import { REFERRAL_TELEGRAM_SHARE_URL } from "@/lib/referral/config";
import { cn } from "@/lib/cn";

import { inviteActionButtonClass } from "./referral-ui";
import {
  DownloadIcon,
  LinkIcon,
  TelegramBrandIcon,
  XBrandIcon
} from "./referral-icons";
import { Loader2 } from "lucide-react";
import { useShare } from "@/hooks/referral/use-share";

export type ShareImageCacheKey = {
  referralCode: string;
  funderAddress?: string;
};

export type ReferralInviteActionsProps = {
  fullLink: string;
  shareCardRef: RefObject<HTMLDivElement | null>;
  shareCardReady: boolean;
  shareImageUploadMode: "cache" | "always";
  shareImageCacheKey?: ShareImageCacheKey;
  className?: string;
  downloadFilename?: string;
  shareTweetText?: string;
  shareTweetHashtags?: string;
  list?: ("x" | "telegram" | "download" | "copy")[];
};

export type ReferralInviteActionsRef = {
  handleTwitter: () => void;
  handleTelegram: () => void;
  handleDownload: () => void;
  handleCopyLink: () => void;
};

export const ReferralInviteActions = forwardRef<
  ReferralInviteActionsRef,
  ReferralInviteActionsProps
>(function ReferralInviteActions({
  fullLink,
  shareCardRef,
  shareCardReady,
  shareImageUploadMode,
  shareImageCacheKey,
  className,
  downloadFilename,
  shareTweetText,
  shareTweetHashtags,
  list = ["x", "telegram", "download", "copy"]
}, ref) {
  const t = useTranslations("referral");

  const {
    handleTwitter,
    handleTelegram,
    handleDownload,
    handleCopyLink,
    downloading,
    sharing,
    copiedVisible,
  } = useShare({
    shareCardReady,
    shareImageUploadMode,
    shareImageCacheKey,
    shareCardRef,
    downloadFilename,
    fullLink,
    tweetText: shareTweetText,
    hashtags: shareTweetHashtags,
  });

  const refs = {
    handleTwitter,
    handleTelegram,
    handleDownload,
    handleCopyLink,
  };
  useImperativeHandle(ref, () => refs);

  return (
    <div className={cn("relative flex items-center justify-between gap-3", className)}>
      {
        list.includes("x") && (
          <button
            type="button"
            className={inviteActionButtonClass}
            aria-label={t("shareOnX")}
            aria-busy={sharing}
            disabled={sharing || !shareCardReady}
            onClick={() => void handleTwitter()}
          >
            {sharing ? <Loader2 className="size-4 animate-spin" /> : <XBrandIcon />}
          </button>
        )
      }
      {
        list.includes("telegram") && (
          <button
            type="button"
            className={inviteActionButtonClass}
            aria-label={t("shareOnTelegram")}
            title={REFERRAL_TELEGRAM_SHARE_URL ? undefined : t("comingSoon")}
            onClick={handleTelegram}
          >
            <TelegramBrandIcon />
          </button>
        )
      }
      {
        list.includes("download") && (
          <button
            type="button"
            className={inviteActionButtonClass}
            aria-label={t("downloadShareCard")}
            aria-busy={downloading}
            disabled={!shareCardReady || downloading}
            onClick={() => void handleDownload()}
          >
            {downloading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <DownloadIcon />
            )}
          </button>
        )
      }
      {
        list.includes("copy") && (
          <button
            type="button"
            className={inviteActionButtonClass}
            aria-label={t("copyReferralLink")}
            onClick={() => void handleCopyLink()}
          >
            <LinkIcon />
          </button>
        )
      }

      <CopiedToast
        visible={copiedVisible}
        className="absolute right-0 top-0 z-10 -translate-y-[calc(100%+8px)]"
      />
    </div>
  );
});
