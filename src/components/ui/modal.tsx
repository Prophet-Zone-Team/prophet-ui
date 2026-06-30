"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";

let bodyScrollLockCount = 0;
let savedBodyOverflow = "";

function lockBodyScroll(): void {
  if (typeof document === "undefined") {
    return;
  }

  if (bodyScrollLockCount === 0) {
    savedBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }

  bodyScrollLockCount += 1;
}

function unlockBodyScroll(): void {
  if (typeof document === "undefined" || bodyScrollLockCount <= 0) {
    return;
  }

  bodyScrollLockCount -= 1;

  if (bodyScrollLockCount === 0) {
    document.body.style.overflow = savedBodyOverflow;
  }
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  ariaLabel: string;
  className?: string;
  overlayClassName?: string;
  hideCloseButton?: boolean;
  overlayCloseable?: boolean;
  escapeCloseable?: boolean;
  closeButtonClassName?: string;
}

export function Modal({
  open,
  onClose,
  children,
  ariaLabel,
  className,
  overlayClassName,
  hideCloseButton = false,
  overlayCloseable = true,
  escapeCloseable = true,
  closeButtonClassName,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    lockBodyScroll();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && escapeCloseable) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      unlockBodyScroll();
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [escapeCloseable, open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4",
        overlayClassName,
      )}
      onClick={() => {
        if (!overlayCloseable) {
          return;
        }
        onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={cn("relative max-h-[calc(100vh-2rem)] overflow-y-auto", className)}
        onClick={(event) => event.stopPropagation()}
      >
        {!hideCloseButton ? (
          <button
            type="button"
            className={cn("absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-prophet-line bg-prophet-panel text-prophet-foreground transition-colors hover:bg-prophet-hover", closeButtonClassName)}
            aria-label="Close"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
        {children}
      </div>
    </div>,
    document.body
  );
}
