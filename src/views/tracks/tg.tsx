"use client";

import { useCallback, useState } from "react";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  BindTelegramDialog,
  type BindTelegramStatus
} from "@/components/bind-tg";
import { DEFAULT_BOT_USERNAME } from "@/components/bind-tg/constants";
import { formatDate } from "@/lib/formatters/datetime";
import { useAuth } from "@/context/auth/use-auth";
import type { TracksTelegramBindLoadStatus } from "@/hooks/tracks/use-tracks-telegram-bind";
import {
  bindProphetTelegram,
  isProphetAuthenticated,
  ProphetApiError
} from "@/service/prophet";

const TELEGRAM_BOT_URL = `https://t.me/${DEFAULT_BOT_USERNAME}`;

export interface TracksTelegramBannerProps {
  telegramBound?: boolean;
  telegramLoadStatus: TracksTelegramBindLoadStatus;
  onTelegramBound: (payload: { bound: boolean; tgUserId?: number }) => void;
}

export default function TracksTelegramBanner({
  telegramBound,
  telegramLoadStatus,
  onTelegramBound
}: TracksTelegramBannerProps) {
  const t = useTranslations("tracks");
  const { openLoginModalOnly } = useAuth();
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

  const handleTelegramClick = useCallback(async () => {
    if (telegramLoadStatus === "loading") {
      return;
    }

    if (!isProphetAuthenticated()) {
      try {
        await openLoginModalOnly();
      } catch {
        return;
      }

      if (!isProphetAuthenticated()) {
        return;
      }
    }

    if (telegramBound === true && telegramLoadStatus === "ready") {
      window.open(TELEGRAM_BOT_URL, "_blank", "noopener,noreferrer");
      return;
    }

    openBindDialog();
  }, [openBindDialog, openLoginModalOnly, telegramBound, telegramLoadStatus]);

  const handleOpenBot = useCallback(async () => {
    if (isBinding) {
      return;
    }

    if (!isProphetAuthenticated()) {
      await openLoginModalOnly();
      return;
    }

    const loginAuth = window.Telegram?.Login?.auth;
    if (!loginAuth) {
      toast.error(t("telegramLoginUnavailable"));
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
            await bindProphetTelegram(data);
            setConnectedAt(formatDate(new Date()));
            setBindStatus("success");
            onTelegramBound({ bound: true, tgUserId: data.id });
          } catch (error) {
            setBindStatus("unbound");

            if (error instanceof ProphetApiError && error.code === 401) {
              await openLoginModalOnly();
            } else if (error instanceof ProphetApiError) {
              toast.error(error.message);
            } else if (error instanceof Error) {
              toast.error(error.message);
            } else {
              toast.error(t("unableToBindTelegram"));
            }
          } finally {
            setIsBinding(false);
          }
        })();
      }
    );
  }, [isBinding, onTelegramBound, openLoginModalOnly, t]);

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
        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[12px] bg-prophet-foreground dark:bg-prophet-primary">
          <Bell
            className="h-[20px] w-[16px] text-white"
            strokeWidth={1.5}
            aria-hidden
          />
        </div>
        <p className="m-0 text-[14px] font-[400] leading-[18px] text-prophet-foreground md:text-[16px] md:leading-[20px]">
          {t("telegramTrackBefore")}{" "}
          <button
            type="button"
            className="border-0 bg-transparent p-0 font-[600] underline cursor-pointer text-inherit disabled:cursor-wait disabled:opacity-60"
            onClick={() => void handleTelegramClick()}
            disabled={telegramLoadStatus === "loading"}
          >
            {t("telegram")}
          </button>{" "}
          {t("telegramTrackAfter")}
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
