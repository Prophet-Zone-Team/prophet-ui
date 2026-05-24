"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { tradeHref } from "@/lib/routes/trade";
import { PageBack } from "@/components/ui/page-back";
import { BackChevronIcon } from "@/components/icons";

export function TradeSimpleHeaderToolbar() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";

  return (
    <div className="absolute inset-x-0 top-2 z-20 flex items-center justify-between px-4 pt-2 sm:px-10">
      <PageBack className="text-white" />

      <Link
        href={tradeHref(slug, "pro")}
        className="inline-flex items-center gap-1.5 text-sm font-[556] leading-[17px] text-white transition-opacity hover:opacity-80"
        aria-label="Professional view"
      >
        <span>more</span>
        <BackChevronIcon className="rotate-180" />
      </Link>
    </div>
  );
}
