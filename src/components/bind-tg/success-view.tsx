"use client";

import { DEFAULT_BOT_USERNAME } from "@/components/bind-tg/constants";
import { BindTgFooter } from "@/components/bind-tg/bind-tg-footer";
import { SuccessIcon } from "@/components/bind-tg/success-icon";

interface SuccessViewProps {
  botUsername?: string;
  connectedAt?: string;
  onDone?: () => void;
  onDisconnect?: () => void;
}

export function SuccessView({
  botUsername = DEFAULT_BOT_USERNAME,
  connectedAt,
  onDone,
  onDisconnect
}: SuccessViewProps) {
  const handle = botUsername.startsWith("@") ? botUsername : `@${botUsername}`;

  return (
    <div className="flex h-full flex-col items-center text-center">
      <SuccessIcon />

      <h2 className="m-0 mt-6 text-lg font-[500] leading-6 text-prophet-foreground">
        Telegram Connected
      </h2>
      <p className="m-0 mt-2 max-w-[300px] text-sm font-[400] leading-normal text-[#909090]">
        Future notifications will be sent to this telegram account
      </p>

      <div className="mt-8 flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <span
            className="size-2 shrink-0 rounded-full bg-[#22C55E]"
            aria-hidden="true"
          />
          <span className="text-sm font-[500] text-prophet-foreground">{handle}</span>
        </div>
        {connectedAt ? (
          <p className="m-0 text-xs font-[400] text-[#909090]">
            Connected on {connectedAt}
          </p>
        ) : null}
      </div>

      <div className="mt-auto w-full pt-6">
        <BindTgFooter
          primaryLabel="Done"
          secondaryLabel="Disconnect"
          primaryVariant="success"
          onPrimaryClick={onDone}
          onSecondaryClick={onDisconnect}
        />
      </div>
    </div>
  );
}
