"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function RoadToFinalBannerSlide() {
  const t = useTranslations("home");
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label={t("roadToFinalBannerAria")}
      onClick={() => {
        router.push("/road-to-final");
      }}
      className="block h-full min-h-[inherit] w-full cursor-pointer"
    >
      <img
        src="/analytics/banner.png"
        alt=""
        width={2224}
        height={690}
        className="h-full min-h-[inherit] w-full object-cover object-center"
      />
    </button>
  );
}
