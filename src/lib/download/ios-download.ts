export const IOS_MOBILECONFIG_PATH = "/Prophet.mobileconfig";

export type IosDownloadContext = {
  isMobile: boolean;
  isIos: boolean;
  isSafari: boolean;
  isWeChat: boolean;
  isQqInApp: boolean;
  needsInAppBrowserGuide: boolean;
  showCopyBar: boolean;
  downloadHref: string | null;
};

function getSafariVersion(ua: string): string | null {
  const match = ua.match(/version\/([\d.]+).*safari/);
  return match?.[1] ?? null;
}

export function getIosDownloadContext(userAgent: string): IosDownloadContext {
  const ua = userAgent.toLowerCase();
  const isIos = /(iphone|ipad|ipod|ios)/i.test(ua);
  const isSafari = isIos && getSafariVersion(ua) !== null;
  const isWeChat = ua.includes("micromessenger");
  const isQqInApp = ua.includes("qq") && !ua.includes("mqqbrowser");
  const isMobile = /windows phone|iphone|android/i.test(userAgent);
  const needsInAppBrowserGuide =
    (isIos && !isSafari) || isWeChat || isQqInApp;

  let downloadHref: string | null = null;
  if (isIos && isSafari && !isWeChat && !isQqInApp) {
    downloadHref = IOS_MOBILECONFIG_PATH;
  }

  return {
    isMobile,
    isIos,
    isSafari,
    isWeChat,
    isQqInApp,
    needsInAppBrowserGuide,
    showCopyBar: isWeChat || isQqInApp,
    downloadHref
  };
}

export async function copyCurrentPageUrl(): Promise<boolean> {
  const url = window.location.href;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch {
    // Fall through to legacy copy.
  }

  const input = document.createElement("input");
  input.value = url;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.left = "-9999px";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(input);
  return copied;
}
