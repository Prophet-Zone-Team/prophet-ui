"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { ExternalLinkConfirmDialog } from "@/components/feedback/external-link-confirm-dialog";
import { cn } from "@/lib/cn";
import { getHostFromHref } from "@/lib/url/get-host-from-href";

import type {
  SignalNewsDetailBodyBlock,
  SignalNewsDetailTextSegment
} from "./types";

export type SignalNewsDetailArticleBodyProps = {
  blocks: SignalNewsDetailBodyBlock[];
  className?: string;
};

const sourceLinkClass =
  "text-black underline decoration-black underline-offset-2";

type PendingExternalLink = {
  href: string;
  host: string;
};

export function SignalNewsDetailArticleBody({
  blocks,
  className
}: SignalNewsDetailArticleBodyProps) {
  const t = useTranslations("signal");
  const [pendingExternalLink, setPendingExternalLink] =
    useState<PendingExternalLink | null>(null);

  function handleSourceLinkClick(href: string) {
    setPendingExternalLink({
      href,
      host: getHostFromHref(href)
    });
  }

  function renderSegments(segments: SignalNewsDetailTextSegment[]) {
    return segments.map((segment, index) => {
      if (segment.kind === "link") {
        if (segment.value === "Source") {
          return (
            <button
              key={`${segment.value}-${index}`}
              type="button"
              className={cn(
                sourceLinkClass,
                "cursor-pointer border-0 bg-transparent p-0 font-inherit text-[inherit] leading-[inherit]"
              )}
              onClick={() => handleSourceLinkClick(segment.href)}
            >
              {t("source")}
            </button>
          );
        }

        return (
          <a
            key={`${segment.value}-${index}`}
            href={segment.href}
            className={sourceLinkClass}
            target="_blank"
            rel="noreferrer"
          >
            {segment.value}
          </a>
        );
      }

      return (
        <span
          key={`${segment.value}-${index}`}
          dangerouslySetInnerHTML={{ __html: segment.value }}
        />
      );
    });
  }

  return (
    <>
      <div className={cn("flex flex-col gap-[16px]", className)}>
        {blocks.map((block, index) => {
          if (block.kind === "subheading") {
            return (
              <h3
                key={`${block.text}-${index}`}
                className="m-0 text-[14px] font-[500] leading-[150%] text-black"
              >
                {block.text}
              </h3>
            );
          }

          return (
            <p
              key={`paragraph-${index}`}
              className="m-0 text-[14px] font-[400] leading-[150%] text-black"
            >
              {renderSegments(block.segments)}
            </p>
          );
        })}
      </div>

      <ExternalLinkConfirmDialog
        open={pendingExternalLink !== null}
        href={pendingExternalLink?.href ?? ""}
        targetHost={pendingExternalLink?.host ?? ""}
        onClose={() => setPendingExternalLink(null)}
      />
    </>
  );
}
