"use client";

import { useEffect, useRef } from "react";

import { useDevice } from "@/hooks/common/use-device";

export function MobileVConsole() {
  const isMobile = useDevice();
  const vConsoleRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    if (!isMobile) {
      vConsoleRef.current?.destroy();
      vConsoleRef.current = null;
      return;
    }

    let cancelled = false;

    void import("vconsole").then(({ default: VConsole }) => {
      if (cancelled || vConsoleRef.current) return;
      vConsoleRef.current = new VConsole();
    });

    return () => {
      cancelled = true;
      vConsoleRef.current?.destroy();
      vConsoleRef.current = null;
    };
  }, [isMobile]);

  return null;
}
