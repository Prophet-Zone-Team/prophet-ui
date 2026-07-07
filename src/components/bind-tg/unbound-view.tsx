"use client";

import { BindTgFooter } from "@/components/bind-tg/bind-tg-footer";
import { BindTgStepList } from "@/components/bind-tg/step-list";
import { TelegramIcon } from "@/components/bind-tg/telegram-icon";

interface UnboundViewProps {
  onOpenBot?: () => void;
  onCheckStatus?: () => void;
}

export function UnboundView({ onOpenBot, onCheckStatus }: UnboundViewProps) {
  return (
    <>
      <div className="flex items-start gap-3">
        <TelegramIcon />
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="m-0 text-lg font-[500] leading-6 text-prophet-foreground">
            Bind Telegram Bot
          </h2>
          <p className="m-0 mt-1 text-sm font-[400] leading-normal text-[#909090]">
            To receive system messages and action reminders
          </p>
        </div>
      </div>

      <div className="mt-8 flex-1">
        <BindTgStepList />
      </div>

      <BindTgFooter
        primaryLabel="Open Telegram Bot"
        secondaryLabel="Done! Check Status"
        onPrimaryClick={onOpenBot}
        onSecondaryClick={onCheckStatus}
      />
    </>
  );
}
