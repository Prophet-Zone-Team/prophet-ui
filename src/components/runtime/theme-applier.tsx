"use client";

import { useEffect } from "react";

import { useDarkModeEnabled } from "@/store/user-config-store";

export function ThemeApplier() {
  const darkModeEnabled = useDarkModeEnabled();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkModeEnabled);
  }, [darkModeEnabled]);

  return null;
}
