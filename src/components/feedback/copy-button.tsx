"use client";

import type { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";

import { CopiedToast } from "@/components/feedback/copied-toast";
import { useCopyWithToast } from "@/hooks/use-copy-with-toast";
import { cn } from "@/lib/cn";

const DEFAULT_TOAST_CLASS =
  "pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-[calc(100%+8px)]";

function useToastPosition(
  buttonRef: React.RefObject<HTMLButtonElement | null>,
  active: boolean
) {
  const [style, setStyle] = useState<CSSProperties>({ visibility: "hidden" });

  const update = useCallback(() => {
    const button = buttonRef.current;
    if (!button) {
      return;
    }

    const { left, top, width } = button.getBoundingClientRect();
    setStyle({
      left: left + width / 2,
      top,
      visibility: "visible"
    });
  }, [buttonRef]);

  useEffect(() => {
    if (!active) {
      return;
    }

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [active, update]);

  return style;
}

export type CopyButtonProps = {
  text: string | undefined | (() => string | undefined);
  ariaLabel: string;
  className?: string;
  toastClassName?: string;
  disabled?: boolean;
  onCopy?: () => void;
  children: ReactNode;
};

export function CopyButton({
  text,
  ariaLabel,
  className,
  toastClassName,
  disabled = false,
  onCopy,
  children
}: CopyButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const { copiedVisible, copy } = useCopyWithToast();
  const toastStyle = useToastPosition(buttonRef, copiedVisible);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = async () => {
    onCopy?.();
    const value = typeof text === "function" ? text() : text;
    await copy(value);
  };

  const toast = (
    <CopiedToast
      visible={copiedVisible}
      style={toastStyle}
      className={cn(DEFAULT_TOAST_CLASS, toastClassName)}
    />
  );

  return (
    <>
      {mounted ? createPortal(toast, document.body) : null}

      <button
        ref={buttonRef}
        type="button"
        className={className}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => void handleCopy()}
      >
        {children}
      </button>
    </>
  );
}
