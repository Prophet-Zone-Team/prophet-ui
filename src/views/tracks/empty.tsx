"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function TracksEmptyState() {
  const t = useTranslations("tracks");

  return (
    <div className="flex flex-col items-center justify-center gap-5 px-3 py-10 md:gap-[26px] md:py-[60px]">
      <p className="m-0 w-full max-w-[313px] text-center text-[16px] font-[400] leading-[20px] text-black">
        {t("emptyMessage")}
      </p>
      <Link
        href="/fifa"
        className="flex h-[42px] w-full max-w-[307px] items-center justify-center gap-[6px] rounded-[8px] bg-[#18110F] no-underline"
        aria-label={t("startToExploreAria")}
      >
        <span className="text-[14px] font-[500] leading-[18px] text-white">
          {t("startToExplore")}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="6"
          height="11"
          viewBox="0 0 6 11"
          fill="none"
          aria-hidden
        >
          <path
            d="M0.799805 0.800781L4.7998 5.19301L0.799805 9.80078"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </Link>
    </div>
  );
}
