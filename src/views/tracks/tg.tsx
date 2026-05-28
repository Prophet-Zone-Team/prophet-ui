"use client";

import { useCallback, useState } from "react";
import { Bell } from "lucide-react";

import {
  BindTelegramDialog,
  type BindTelegramStatus
} from "@/components/bind-tg";
import { DEFAULT_BOT_USERNAME } from "@/components/bind-tg/constants";

const TELEGRAM_BOT_URL = `https://t.me/${DEFAULT_BOT_USERNAME}`;

export default function TracksTelegramBanner() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bindStatus, setBindStatus] = useState<BindTelegramStatus>("unbound");

  const openBindDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const closeBindDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleOpenBot = useCallback(() => {
    // setBindStatus("binding");
    window.Telegram?.Login.auth(
      { bot_id: "8770327699", request_access: true },
      (data) => {
        if (!data) {
          return;
        }
        console.log(data);
      }
    );
  }, []);

  const handleCheckStatus = useCallback(() => {
    setBindStatus((current) => (current === "unbound" ? "binding" : current));
  }, []);

  const handleDisconnect = useCallback(() => {
    setBindStatus("unbound");
    setDialogOpen(false);
  }, []);

  return (
    <>
      <div className="mt-4 flex flex-col items-center justify-center gap-2 px-2 text-center sm:flex-row sm:gap-[8px] sm:text-left">
        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[12px] bg-black">
          <Bell
            className="h-[20px] w-[16px] text-white"
            strokeWidth={1.5}
            aria-hidden
          />
        </div>
        <p className="m-0 text-[14px] font-[400] leading-[18px] text-black md:text-[16px] md:leading-[20px]">
          Track on your{" "}
          <button
            type="button"
            className="border-0 bg-transparent p-0 font-[600] underline cursor-pointer text-inherit"
            onClick={openBindDialog}
          >
            Telegram
          </button>{" "}
          to receive real time notifications
        </p>
      </div>

      <BindTelegramDialog
        open={dialogOpen}
        onClose={closeBindDialog}
        status={bindStatus}
        botUsername={DEFAULT_BOT_USERNAME}
        botUrl={TELEGRAM_BOT_URL}
        onOpenBot={handleOpenBot}
        onCheckStatus={handleCheckStatus}
        onDisconnect={handleDisconnect}
      />
    </>
  );
}
