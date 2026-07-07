"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";

function isValidXUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    return host === "x.com" || host === "twitter.com";
  } catch {
    return false;
  }
}

export function TweetUrlSubmitModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (twitterUrl: string) => Promise<void>;
  isSubmitting?: boolean;
}) {
  const t = useTranslations("roadToFinal");
  const [twitterUrl, setTwitterUrl] = useState("");

  useEffect(() => {
    if (!open) {
      setTwitterUrl("");
    }
  }, [open]);

  const trimmedUrl = twitterUrl.trim();
  const canSubmit =
    trimmedUrl.length > 0 && isValidXUrl(trimmedUrl) && !isSubmitting;

  const requestClose = () => {
    if (isSubmitting) {
      return;
    }

    if (window.confirm(t("tweetUrlCloseConfirm"))) {
      onClose();
    }
  };

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [open]);

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    await onSubmit(trimmedUrl);
  };

  return (
    <Modal
      open={open}
      onClose={requestClose}
      ariaLabel={t("provideXSharingLink")}
      className="w-full max-w-[500px]"
      overlayClassName="z-[80]"
    >
      <div
        className={cn(
          "rounded-[20px] border border-prophet-line bg-prophet-panel",
          "p-[20px] shadow-[0_0_10px_rgba(0,0,0,0.1)]"
        )}
      >
        <h2 className="m-0 pr-[32px] text-[16px] font-medium text-prophet-foreground">
          {t("shareModalTitle")}
        </h2>

        <p className="m-0 mt-[16px] text-[14px] font-medium text-prophet-foreground">
          {t("provideXSharingLink")}
        </p>

        <div
          className={cn(
            "mt-[12px] flex items-start gap-[8px] rounded-[6px]",
            "bg-[rgba(253,211,87,0.2)] px-[10px] py-[12px]"
          )}
        >
          <img
            src="/icons/icon-info.svg"
            alt=""
            className="mt-[2px] size-4 shrink-0 object-contain"
          />
          <p className="m-0 text-[14px] leading-[1.4] text-[#D1A00F]">
            {t("xUrlVerificationHint")}
          </p>
        </div>

        <input
          type="url"
          value={twitterUrl}
          onChange={(event) => setTwitterUrl(event.target.value)}
          placeholder={t("xUrlPlaceholder")}
          className={cn(
            "mt-[16px] h-[57px] w-full rounded-[6px] border border-prophet-line",
            "px-[14px] text-[14px] text-prophet-foreground outline-none",
            "placeholder:text-prophet-foreground/30 focus:border-black/20"
          )}
        />

        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => void handleSubmit()}
          className={cn(
            "mt-[20px] flex h-[50px] w-full items-center justify-center",
            "rounded-[8px] bg-black text-[16px] text-white transition",
            "disabled:cursor-not-allowed disabled:opacity-40 hover:opacity-90"
          )}
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            t("save")
          )}
        </button>
      </div>
    </Modal>
  );
}
