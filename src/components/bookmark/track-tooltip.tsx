"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { TrackHintIcon } from "@/components/bookmark/bookmark-icons";

export function TrackTooltip({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#EBEBEB] bg-white px-4 py-3 shadow-[0_0_10px_rgba(0,0,0,0.1)]">
      <TrackHintIcon />
      <p className="m-0 text-[16px] leading-[19px] text-black">{children}</p>
    </div>
  );
}

export function TrackLink() {
  const t = useTranslations("trade");

  return (
    <Link
      href="/tracks"
      className="pointer-events-auto font-[500] underline-offset-2 hover:underline"
    >
      {t("tracksLink")}
    </Link>
  );
}
