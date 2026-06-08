"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

import { getToastTopOffset } from "@/config/toast-layout";

export function Toaster(props: ToasterProps) {
  const topOffset = getToastTopOffset();

  return (
    <Sonner
      theme="light"
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
            "group toast rounded-prophet border border-prophet-line bg-white font-body text-[#18110F] shadow-prophet-wallet",
          title: "text-sm font-medium text-[#18110F]",
          description: "text-sm text-prophet-muted",
          actionButton:
            "rounded-prophet bg-[#18110F] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#2a1f1c]",
          cancelButton:
            "rounded-prophet border border-prophet-line bg-white px-3 py-1.5 text-xs font-medium text-[#18110F] transition-colors hover:bg-[#fafbfc]",
          closeButton:
            "border border-prophet-line bg-white text-[#18110F] transition-colors hover:bg-[#fafbfc]"
        }
      }}
      {...props}
    />
  );
}
