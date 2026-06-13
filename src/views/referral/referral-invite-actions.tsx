"use client";

import { useCallback, useState, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { CopiedToast } from "@/components/feedback/copied-toast";
import { useCopyWithToast } from "@/hooks/use-copy-with-toast";
import { REFERRAL_TELEGRAM_SHARE_URL } from "@/lib/referral/config";
import { downloadShareCardPng } from "@/lib/referral/download-share-card";
import {
  readReferralShareImageCache,
  writeReferralShareImageCache
} from "@/lib/referral/referral-share-image-cache";
import { renderShareCardBlob } from "@/lib/referral/render-share-card";
import { resolveOrigin } from "@/lib/referral/referral-link";
import { cn } from "@/lib/cn";
import {
  trackCopyLinkClicked,
  trackShareClicked
} from "@/lib/analytics/tracking";
import {
  isProphetAuthenticated,
  ProphetApiError,
  uploadProphetFile
} from "@/service/prophet";
import { shareToX } from "@/utils/x";

import { inviteActionButtonClass } from "./referral-ui";
import {
  DownloadIcon,
  LinkIcon,
  TelegramBrandIcon,
  XBrandIcon
} from "./referral-icons";
import { Loader2 } from "lucide-react";

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
};

export function ReferralInviteActions({
  fullLink,
  shareCardRef,
  shareCardReady,
  shareImageUploadMode,
  shareImageCacheKey,
  className,
  downloadFilename
}: ReferralInviteActionsProps) {
  const t = useTranslations("referral");
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const { copiedVisible, copy } = useCopyWithToast();

  const handleTwitter = useCallback(async () => {
    if (!shareCardReady || sharing) {
      return;
    }

    if (!isProphetAuthenticated()) {
      toast.error(t("shareUploadAuthRequired"));
      return;
    }

    setSharing(true);

    trackShareClicked({
      target: "x",
      label: "Share on X",
      entrySource: "referral_invite_modal"
    });

    try {
      let imgUrl: string | null = null;

      if (
        shareImageUploadMode === "cache" &&
        shareImageCacheKey?.referralCode
      ) {
        // imgUrl = readReferralShareImageCache(shareImageCacheKey);
      }

      if (!imgUrl) {
        const element = shareCardRef.current;
        if (!element) {
          toast.error(t("shareCardNotReady"));
          return;
        }

        const blob = await renderShareCardBlob(element);
        if (!blob) {
          toast.error(t("shareCardNotReady"));
          return;
        }

        const uploadResult = await uploadProphetFile(blob);
        imgUrl = uploadResult.url;

        if (
          shareImageUploadMode === "cache" &&
          shareImageCacheKey?.referralCode
        ) {
          writeReferralShareImageCache({
            ...shareImageCacheKey,
            url: imgUrl
          });
        }
      }

      // imgUrl = "https://assets.dapdap.net/monad/upload/47a465d1-47cd-4d0c-8933-568ff1e6f862";

      const origin = resolveOrigin();
      const tweetUrl = `${origin}/api/twitter?img=${encodeURIComponent(imgUrl)}&link=${encodeURIComponent(fullLink)}`;
      shareToX(t("shareTweetIntro"), `${tweetUrl}\n\n`, {
        hashtags: "Prophet,PredictionMarkets,WorldCup2026,Polymarket"
      });
    } catch (error) {
      if (error instanceof ProphetApiError) {
        toast.error(error.message);
      } else {
        toast.error(t("shareUploadError"));
      }
    } finally {
      setSharing(false);
    }
  }, [
    fullLink,
    shareCardReady,
    shareCardRef,
    shareImageCacheKey,
    shareImageUploadMode,
    sharing,
    t
  ]);

  const handleTelegram = useCallback(() => {
    if (!REFERRAL_TELEGRAM_SHARE_URL) {
      return;
    }
    trackShareClicked({
      target: "telegram",
      label: "Share on Telegram",
      entrySource: "referral_invite_modal"
    });
    window.open(REFERRAL_TELEGRAM_SHARE_URL, "_blank", "noopener,noreferrer");
  }, []);

  const handleDownload = useCallback(async () => {
    const element = shareCardRef.current;
    if (!element || !shareCardReady || downloading) {
      return;
    }

    setDownloading(true);
    try {
      await downloadShareCardPng(element, downloadFilename);
    } finally {
      setDownloading(false);
    }
  }, [downloadFilename, downloading, shareCardReady, shareCardRef]);

  const handleCopyLink = useCallback(async () => {
    trackCopyLinkClicked({
      target: "referral_link",
      label: "Copy referral link",
      entrySource: "referral_invite_modal"
    });
    await copy(fullLink);
  }, [copy, fullLink]);

  return (
    <div className={cn("relative grid grid-cols-4 gap-3", className)}>
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

      <button
        type="button"
        className={inviteActionButtonClass}
        aria-label={t("shareOnTelegram")}
        title={REFERRAL_TELEGRAM_SHARE_URL ? undefined : t("comingSoon")}
        onClick={handleTelegram}
      >
        <TelegramBrandIcon />
      </button>

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

      <button
        type="button"
        className={inviteActionButtonClass}
        aria-label={t("copyReferralLink")}
        onClick={() => void handleCopyLink()}
      >
        <LinkIcon />
      </button>

      <CopiedToast
        visible={copiedVisible}
        className="absolute right-0 top-0 z-10 -translate-y-[calc(100%+8px)]"
      />
    </div>
  );
}
