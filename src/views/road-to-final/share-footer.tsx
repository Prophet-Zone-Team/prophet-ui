"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { useAuth } from "@/context/auth/use-auth";
import { cn } from "@/lib/cn";

export function ShareFooter({
  hasChampion,
  onShare
}: {
  hasChampion: boolean;
  onShare: () => void;
}) {
  const t = useTranslations("roadToFinal");
  const { isAuthenticated, loginInProgress, openLoginModalOnly } = useAuth();

  const handleClick = () => {
    if (!hasChampion) {
      return;
    }

    if (isAuthenticated) {
      onShare();
      return;
    }

    void openLoginModalOnly();
  };

  const label = !isAuthenticated
    ? loginInProgress
      ? t("connecting")
      : t("shareResult")
    : t("shareResult");

  return (
    <div className="flex justify-center py-[24px]">
      <button
        type="button"
        disabled={!hasChampion || loginInProgress}
        className={cn(
          "inline-flex items-center gap-[8px] rounded-[24px] bg-white px-[28px] py-[12px] text-[16px] font-[400] text-black transition",
          hasChampion && !loginInProgress
            ? "hover:bg-white/90"
            : "cursor-not-allowed opacity-40"
        )}
        onClick={handleClick}
      >
        {label}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
