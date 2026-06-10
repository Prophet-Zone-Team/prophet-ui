"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { COPIED_TOAST_VISIBLE_MS } from "@/lib/clipboard/config";
import { copyToClipboard } from "@/lib/clipboard/copy-to-clipboard";

export type UseCopyWithToastOptions = {
  visibleMs?: number;
};

export function useCopyWithToast(options?: UseCopyWithToastOptions) {
  const visibleMs = options?.visibleMs ?? COPIED_TOAST_VISIBLE_MS;
  const [copiedVisible, setCopiedVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (text: string | undefined): Promise<boolean> => {
      const ok = await copyToClipboard(text);
      if (!ok) {
        return false;
      }

      setCopiedVisible(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setCopiedVisible(false);
      }, visibleMs);

      return true;
    },
    [visibleMs]
  );

  return { copiedVisible, copy };
}
