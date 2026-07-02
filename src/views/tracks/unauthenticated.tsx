"use client";

import { useTranslations } from "next-intl";

export interface TracksUnauthenticatedStateProps {
  onConnect: () => void;
  connecting?: boolean;
}

export function TracksUnauthenticatedState({
  onConnect,
  connecting = false
}: TracksUnauthenticatedStateProps) {
  const t = useTranslations("tracks");

  return (
    <div className="flex flex-col items-center justify-center gap-[26px] py-[60px]">
      <p className="m-0 w-full max-w-[360px] text-center text-[16px] font-[400] leading-[20px] text-prophet-foreground">
        {t("unauthenticatedMessage")}
      </p>
      <button
        type="button"
        onClick={onConnect}
        disabled={connecting}
        className="flex h-[42px] w-full max-w-[307px] items-center justify-center gap-[6px] rounded-[8px] bg-[#18110F] dark:bg-prophet-primary text-[14px] font-[500] leading-[18px] text-white disabled:opacity-60"
        aria-label={t("connectWalletAria")}
      >
        {connecting ? t("connecting") : t("connectWallet")}
      </button>
    </div>
  );
}
