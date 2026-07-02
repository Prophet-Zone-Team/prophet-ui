import { useConfigHydrated, useDarkModeEnabled } from "@/store";

export function useResolvedDarkMode(): boolean {
  const darkModeEnabled = useDarkModeEnabled();
  const hasHydrated = useConfigHydrated();

  if (hasHydrated) {
    return darkModeEnabled;
  }

  if (typeof document !== "undefined") {
    return document.documentElement.classList.contains("dark");
  }

  return false;
}

export function readResolvedDarkModeFromDocument(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  return document.documentElement.classList.contains("dark");
}
