import { Metadata } from "@/context/rainbowkit/metadata";

export function getAppOrigin() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (envUrl) {
    try {
      return new URL(envUrl).origin;
    } catch {
      return envUrl.replace(/\/$/, "");
    }
  }

  return Metadata.url;
}

export function getAppIconUrl() {
  const iconPath = Metadata.icons[0];

  if (iconPath.startsWith("http://") || iconPath.startsWith("https://")) {
    return iconPath;
  }

  return `${getAppOrigin()}${iconPath.startsWith("/") ? iconPath : `/${iconPath}`}`;
}
