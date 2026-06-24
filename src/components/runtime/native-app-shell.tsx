"use client";

import { useEffect } from "react";

import { isNativeApp } from "@/lib/runtime/is-native-app";

export function NativeAppShell() {
  useEffect(() => {
    if (!isNativeApp()) {
      return;
    }

    document.documentElement.classList.add("native-app");
  }, []);

  return null;
}
