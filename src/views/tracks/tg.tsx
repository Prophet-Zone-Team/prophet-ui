"use client";

import { useCallback, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";

import {
  BindTelegramDialog,
  type BindTelegramStatus
} from "@/components/bind-tg";
import { DEFAULT_BOT_USERNAME } from "@/components/bind-tg/constants";
import { useAuth } from "@/context/auth/use-auth";
import {
  bindProphetTelegram,
  isProphetAuthenticated,
  ProphetApiError
} from "@/service/prophet";

const TELEGRAM_BOT_URL = `https://t.me/${DEFAULT_BOT_USERNAME}`;

export default function TracksTelegramBanner() {
  const { openLogin } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bindStatus, setBindStatus] = useState<BindTelegramStatus>("unbound");
  const [connectedAt, setConnectedAt] = useState<string | undefined>();
  const [isBinding, setIsBinding] = useState(false);

  const openBindDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const closeBindDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleOpenBot = useCallback(async () => {
    if (isBinding) {
      return;
    }

    if (!isProphetAuthenticated()) {
      await openLogin();
      return;
    }

    const loginAuth = window.Telegram?.Login?.auth;
    if (!loginAuth) {
      toast.error(
        "Telegram login is unavailable. Please refresh and try again."
      );
      return;
    }

    loginAuth(
      {
        bot_id: process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID || "",
        request_access: true
      },
      (data) => {
        if (!data) {
          return;
        }

        void (async () => {
          setIsBinding(true);
          setBindStatus("binding");

          try {
            await bindProphetTelegram({ tg_user_id: data.id });
            setConnectedAt(new Date().toLocaleDateString());
            setBindStatus("success");
          } catch (error) {
            setBindStatus("unbound");

            if (error instanceof ProphetApiError && error.code === 401) {
              await openLogin();
            } else if (error instanceof ProphetApiError) {
              toast.error(error.message);
            } else if (error instanceof Error) {
              toast.error(error.message);
            } else {
              toast.error("Unable to bind Telegram.");
            }
          } finally {
            setIsBinding(false);
          }
        })();
      }
    );
  }, [isBinding, openLogin]);

  const handleCheckStatus = useCallback(() => {
    setBindStatus((current) => (current === "unbound" ? "binding" : current));
  }, []);

  const handleDisconnect = useCallback(() => {
    setBindStatus("unbound");
    setConnectedAt(undefined);
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
        connectedAt={connectedAt}
        onOpenBot={() => void handleOpenBot()}
        onCheckStatus={handleCheckStatus}
        onDisconnect={handleDisconnect}
      />
    </>
  );
}
