"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

import { UserProfileCard } from "./user-profile-card";

export interface UserProfileEmptyStateProps {
  className?: string;
  variant?: "connect" | "create";
  onAction?: () => void;
}

export function UserProfileEmptyState({
  className,
  variant = "create",
  onAction,
}: UserProfileEmptyStateProps) {
  const t = useTranslations("copyTrade.profile");

  return (
    <UserProfileCard
      className={cn(
        "flex h-[262px] flex-col items-center justify-center gap-4 px-5",
        className
      )}
    >
      <div
        className="size-[46px] shrink-0 rounded-full border border-white bg-[#EBEBEB]"
        aria-hidden="true"
      />

      <p className="text-center text-[16px] leading-5 text-[#909090]">
        {variant === "connect"
          ? t("connectDescription")
          : t("createDescription")}
      </p>

      <button
        type="button"
        className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-black text-[16px] leading-5 text-white transition-opacity hover:opacity-90"
        onClick={onAction}
      >
        {variant === "connect" ? t("connectAction") : t("createAction")}
      </button>
    </UserProfileCard>
  );
}
