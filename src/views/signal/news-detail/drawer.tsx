"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import { useDevice } from "@/hooks/common/use-device";
import { cn } from "@/lib/cn";

import { SignalNewsDetailArticleBody } from "./article-body";
import { SignalNewsDetailCloseButton } from "./close-button";
import { SignalNewsDetailMetadataRow } from "./metadata-row";
import type { SignalNewsDetail } from "./types";

const DRAWER_TRANSITION = {
  type: "tween" as const,
  duration: 0.32,
  ease: [0.32, 0.72, 0, 1] as const
};

const BACKDROP_TRANSITION = {
  type: "tween" as const,
  duration: 0.24
};

export type SignalNewsDetailDrawerProps = {
  open: boolean;
  detail: SignalNewsDetail | null;
  onClose: () => void;
};

export function SignalNewsDetailDrawer({
  open,
  detail,
  onClose
}: SignalNewsDetailDrawerProps) {
  const isMobile = useDevice();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open && detail ? (
        <div
          className={cn(
            "fixed inset-0 z-[70] flex",
            isMobile ? "items-end justify-center" : "justify-end"
          )}
        >
          <motion.button
            type="button"
            aria-label="Close news detail overlay"
            className="absolute inset-0 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={BACKDROP_TRANSITION}
            onClick={onClose}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={detail.title}
            className={cn(
              "relative flex w-full flex-col bg-white",
              isMobile
                ? "max-h-[92dvh] rounded-t-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.12)]"
                : "h-full max-w-[660px] shadow-[-10px_0px_10px_rgba(0,0,0,0.1)]"
            )}
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={DRAWER_TRANSITION}
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-8 pt-4 md:px-[30px] md:pb-[40px] md:pt-[20px]">
              <SignalNewsDetailCloseButton
                onClick={onClose}
                className="mb-[20px] shrink-0 self-start"
              />

              <div className="mx-auto flex w-full max-w-[600px] flex-col">
                {detail.imageUrl ? (
                  <img
                    src={detail.imageUrl}
                    alt={detail.imageAlt}
                    className="h-[200px] w-full rounded-[12px] object-cover md:h-[338px]"
                  />
                ) : (
                  <div
                    className="flex h-[200px] w-full items-center justify-center rounded-[12px] bg-[#F0F2F5] text-[14px] font-[400] text-[#909090] md:h-[338px]"
                    aria-hidden="true"
                  >
                    No image available
                  </div>
                )}

                <h2 className="m-0 mt-[20px] text-[20px] font-[500] leading-[24px] text-black">
                  {detail.title}
                </h2>

                <p className="m-0 mt-[12px] text-[14px] font-[400] leading-[17px] text-[#909090]">
                  {detail.updatedAtLabel}
                </p>

                <SignalNewsDetailMetadataRow
                  sentiment={detail.sentiment}
                  impactScore={detail.impactScore}
                  relatedLabel={detail.relatedLabel}
                  categoryLabel={detail.categoryLabel}
                  className="mt-[12px]"
                />

                <SignalNewsDetailArticleBody
                  blocks={detail.body}
                  className="mt-[20px]"
                />
              </div>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
