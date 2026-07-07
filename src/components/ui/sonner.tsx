"use client";

import { useDarkModeEnabled } from "@/store/user-config-store";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { getToastTopOffset } from "@/config/toast-layout";

export function Toaster(props: ToasterProps) {
  const topOffset = getToastTopOffset();
  const darkModeEnabled = useDarkModeEnabled();

  return (
    <Sonner
      theme={darkModeEnabled ? "dark" : "light"}
      position="top-right"
      offset={{ top: topOffset }}
      mobileOffset={{ top: topOffset }}
      closeButton
      richColors
      expand
      visibleToasts={5}
      toastOptions={{
        classNames: {
          toast:
            "group toast rounded-prophet border border-prophet-line bg-prophet-panel font-body text-prophet-foreground shadow-prophet-wallet",
          title: "text-sm font-medium text-prophet-foreground",
          description: "text-sm text-prophet-muted",
          actionButton:
            "rounded-prophet bg-prophet-primary px-3 py-1.5 text-xs font-medium text-prophet-primary-foreground transition-colors hover:opacity-90",
          cancelButton:
            "rounded-prophet border border-prophet-line bg-prophet-panel px-3 py-1.5 text-xs font-medium text-prophet-foreground transition-colors hover:bg-prophet-hover",
          closeButton:
            "border border-prophet-line bg-prophet-panel text-prophet-foreground transition-colors hover:bg-prophet-hover"
        }
      }}
      {...props}
    />
  );
}
