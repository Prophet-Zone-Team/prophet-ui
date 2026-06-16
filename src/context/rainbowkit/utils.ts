// Simplily detect mobile device
export function isInMobileBrowser() {
  return (
    typeof navigator !== "undefined" &&
    navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i)
  );
}

// check simply if current environment is browser or not
export function isInBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined" && typeof navigator !== "undefined";
}
export type InAppBrowserWalletKind = "tokenpocket" | "okx";

function hasTokenPocketUserAgent() {
  return (
    typeof navigator !== "undefined" &&
    navigator.userAgent.toLowerCase().includes("tokenpocket")
  );
}

function hasOkxUserAgent() {
  return typeof navigator !== "undefined" && /OKApp/i.test(navigator.userAgent);
}

// Detect if in TokenPocketApp
export function isInTokenPocket() {
  return (
    isInBrowser() &&
    (typeof window.tokenpocket !== "undefined" || hasTokenPocketUserAgent())
  );
}
// Determine whether the current environment supports the TP Wallet extension
export function supportTokenPocket() {
  return !!(window as any).tronWeb && typeof (window as any).tokenpocket !== "undefined";
}

// Determine whether the app is running within the OKX built-in browser
export function isInOKApp() {
  if (!isInBrowser()) {
    return false;
  }

  return typeof window.okxwallet !== "undefined" || hasOkxUserAgent();
}

export function isInWalletInAppBrowser(): boolean {
  return isInTokenPocket() || isInOKApp();
}

export function getInAppBrowserWalletKind(): InAppBrowserWalletKind | null {
  if (isInTokenPocket()) {
    return "tokenpocket";
  }

  if (isInOKApp()) {
    return "okx";
  }

  return null;
}

// open tp wallet app
export function openTokenPocket(params?: { checkOnly?: boolean; }) {
  const { checkOnly = false } = params || {};

  if (!supportTokenPocket() && isInMobileBrowser() && !isInTokenPocket()) {
    if (checkOnly) {
      return true;
    }

    const { origin, pathname, search, hash } = window.location;
    const url = origin + pathname + search + hash;
    const params = {
      action: "open",
      actionId: Date.now() + "",
      callbackUrl: "http://someurl.com", // no need callback
      blockchain: "matic",
      chain: "matic",
      url,
      protocol: "TokenPocket",
      version: "1.0",
    };
    window.location.href = `tpdapp://open?params=${encodeURIComponent(JSON.stringify(params))}`;
    return true;
  }
  return false;
}

// open okx wallet app
export function openOkxWallet(params?: { checkOnly?: boolean; }) {
  const { checkOnly = false } = params || {};

  if (isInMobileBrowser() && !isInOKApp()) {
    if (checkOnly) {
      return true;
    }

    window.location.href = "okx://wallet/dapp/url?dappUrl=" + encodeURIComponent(window.location.href);
    return true;
  }
  return false;
}
