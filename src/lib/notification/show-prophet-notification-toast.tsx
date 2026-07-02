"use client";

import { toast } from "sonner";

import { ProphetNotificationToastContentView } from "@/components/notification/prophet-notification-toast-content";
import {
  formatProphetNotificationToast,
  type ProphetNotificationToastContent,
} from "@/lib/notification/format-prophet-notification-toast";
import type { ProphetNotificationData } from "@/types/prophet-notification-ws";

export function showProphetNotificationToast(
  data: ProphetNotificationData,
  content?: ProphetNotificationToastContent,
): void {
  const resolved = content ?? formatProphetNotificationToast(data);

  if (!resolved) {
    return;
  }

  toast.custom(
    () => <ProphetNotificationToastContentView content={resolved} />,
    {
      duration: resolved.duration,
      className:
        "rounded-prophet border border-prophet-line bg-prophet-panel p-0 shadow-prophet-wallet",
    },
  );
}
