"use client";

import { useCallback, useEffect } from "react";

import { BindTgClose } from "@/components/bind-tg/bind-tg-close";
import { bindTgCardClass } from "@/components/bind-tg/bind-tg-ui";
import { BIND_TG_MODAL_WIDTH } from "@/components/bind-tg/constants";
import { BindingView } from "@/components/bind-tg/binding-view";
import { SuccessView } from "@/components/bind-tg/success-view";
import type { BindTelegramDialogProps } from "@/components/bind-tg/types";
import { UnboundView } from "@/components/bind-tg/unbound-view";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";

export type { BindTelegramDialogProps, BindTelegramStatus } from "@/components/bind-tg/types";

export function BindTelegramDialog({
  open,
  onClose,
  status,
  botUsername,
  botUrl,
  connectedAt,
  pollIntervalSeconds,
  onOpenBot,
  onCheckStatus,
  onDisconnect,
}: BindTelegramDialogProps) {
  const handleOpenBot = useCallback(() => {
    if (onOpenBot) {
      onOpenBot();
      return;
    }

    if (botUrl && typeof window !== "undefined") {
      window.open(botUrl, "_blank", "noopener,noreferrer");
    }
  }, [botUrl, onOpenBot]);

  useEffect(() => {
    if (!open || status !== "binding" || !onCheckStatus) {
      return undefined;
    }

    const intervalMs = (pollIntervalSeconds ?? 3) * 1000;
    const timer = window.setInterval(() => {
      onCheckStatus();
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [open, onCheckStatus, pollIntervalSeconds, status]);

  const ariaLabel =
    status === "success"
      ? "Telegram connected"
      : status === "binding"
        ? "Waiting for Telegram confirmation"
        : "Bind Telegram Bot";

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={ariaLabel}
      className={BIND_TG_MODAL_WIDTH}
      hideCloseButton
      overlayCloseable
    >
      <div className={cn(bindTgCardClass)}>
        <BindTgClose onClose={onClose} />

        <div
          className={cn(
            "flex h-full flex-col px-6 pb-6 pt-10",
            status === "unbound" ? "text-left" : "text-center"
          )}
        >
          {status === "unbound" ? (
            <UnboundView
              onOpenBot={handleOpenBot}
              onCheckStatus={onCheckStatus}
            />
          ) : null}

          {status === "binding" ? (
            <BindingView
              pollIntervalSeconds={pollIntervalSeconds}
              onOpenBot={handleOpenBot}
              onCheckStatus={onCheckStatus}
            />
          ) : null}

          {status === "success" ? (
            <SuccessView
              botUsername={botUsername}
              connectedAt={connectedAt}
              onDone={onClose}
              onDisconnect={onDisconnect}
            />
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
