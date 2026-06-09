"use client";

import { DEFAULT_POLL_INTERVAL_SECONDS } from "@/components/bind-tg/constants";
import { BindTgFooter } from "@/components/bind-tg/bind-tg-footer";
import { TelegramIcon } from "@/components/bind-tg/telegram-icon";

interface BindingViewProps {
  pollIntervalSeconds?: number;
  onOpenBot?: () => void;
  onCheckStatus?: () => void;
}

export function BindingView({
  pollIntervalSeconds = DEFAULT_POLL_INTERVAL_SECONDS,
  onOpenBot,
  onCheckStatus,
}: BindingViewProps) {
  return (
    <div className="flex h-full flex-col items-center text-center">
      <TelegramIcon variant="glow" />

      <h2 className="m-0 mt-6 text-lg font-[500] leading-6 text-black">
        Waiting for confirmation
      </h2>
      <p className="m-0 mt-2 max-w-[300px] text-sm font-[400] leading-normal text-[#909090]">
        Tap <span className="text-black">/start/</span> in Telegram. This page
        will update automatically
      </p>

      <div className="mt-8 flex items-center gap-2">
        <span
          className="size-2 shrink-0 rounded-full bg-[#FFCC00]"
          aria-hidden="true"
        />
        <span className="text-sm font-[500] text-black">Not connect yet</span>
      </div>
      <p className="m-0 mt-2 text-xs font-[400] text-[#909090]">
        Checking every {pollIntervalSeconds} seconds
      </p>

      <div className="mt-auto w-full pt-6">
        <BindTgFooter
          primaryLabel="Open Telegram Bot"
          secondaryLabel="Done! Check Status"
          primaryVariant="muted"
          onPrimaryClick={onOpenBot}
          onSecondaryClick={onCheckStatus}
        />
      </div>
    </div>
  );
}
