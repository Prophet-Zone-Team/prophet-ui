import { POLYGON_NETWORK } from "@/lib/market/deposit-assets";

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

export type InAppBrowserWalletKind = "tokenpocket" | "okx" | "metamask" | "binance";

const BINANCE_W3W_APP_ID = "yFK5FCqYprrXDiVFbhyRx7";
const BINANCE_DEEPLINK_BASE = "bnc://app.binance.com/mp/app";
const BINANCE_UNIVERSAL_LINK = "https://app.binance.com/en/download";

type InjectedEthereum = {
  isMetaMask?: boolean;
  isBinance?: boolean;
  isOkxWallet?: boolean;
  isOKExWallet?: boolean;
  isTokenPocket?: boolean;
};

function getInjectedEthereum(): InjectedEthereum | undefined {
  if (!isInBrowser()) {
    return undefined;
  }

  return window.ethereum as InjectedEthereum | undefined;
}

function hasTokenPocketUserAgent() {
  return (
    typeof navigator !== "undefined" &&
    navigator.userAgent.toLowerCase().includes("tokenpocket")
  );
}

function hasOkxUserAgent() {
  return typeof navigator !== "undefined" && /OKApp/i.test(navigator.userAgent);
}

function hasMetaMaskUserAgent() {
  return typeof navigator !== "undefined" && /MetaMaskMobile/i.test(navigator.userAgent);
}

function isMetaMaskProvider(ethereum?: InjectedEthereum) {
  if (!ethereum?.isMetaMask) {
    return false;
  }

  if (ethereum.isBinance) return false;
  if (ethereum.isOkxWallet || ethereum.isOKExWallet) return false;
  if (ethereum.isTokenPocket) return false;

  return true;
}

function stripProtocol(href: string) {
  return href.replace(/^https?:\/\//, "");
}

function navigateWalletDeepLink(href: string) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.target = "_self";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function buildBinanceWalletDeepLink(href: string) {
  const encodedHref = encodeURIComponent(href);
  const startPagePath = window.btoa("/pages/browser/index");
  const startPageQuery = window.btoa(
    `url=${encodedHref}&defaultChainId=${POLYGON_NETWORK.chainId}`,
  );

  const deeplink = new URL(BINANCE_DEEPLINK_BASE);
  deeplink.searchParams.set("appId", BINANCE_W3W_APP_ID);
  deeplink.searchParams.set("startPagePath", startPagePath);
  deeplink.searchParams.set("startPageQuery", startPageQuery);

  const universalLink = new URL(BINANCE_UNIVERSAL_LINK);
  universalLink.searchParams.set("_dp", window.btoa(deeplink.toString()));

  return universalLink.toString();
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

  return hasOkxUserAgent();
}

export function isInMetaMask() {
  if (!isInBrowser()) {
    return false;
  }

  // MetaMask extension on desktop also sets window.ethereum.isMetaMask; only the
  // mobile in-app browser adds MetaMaskMobile to the user agent.
  if (hasMetaMaskUserAgent()) {
    return true;
  }

  // Legacy in-app builds may omit MetaMaskMobile; only trust injected provider on mobile.
  return Boolean(isInMobileBrowser() && isMetaMaskProvider(getInjectedEthereum()));
}

export function isInBinanceApp() {
  if (!isInBrowser()) {
    return false;
  }

  return (
    typeof window.binancew3w?.ethereum !== "undefined" ||
    getInjectedEthereum()?.isBinance === true
  );
}

export function isInWalletInAppBrowser(): boolean {
  const _isInTokenPocket = isInTokenPocket();
  const _isInOKApp = isInOKApp();
  const _isInBinanceApp = isInBinanceApp();
  const _isInMetaMask = isInMetaMask();
  return (
    _isInTokenPocket ||
    _isInOKApp ||
    _isInBinanceApp ||
    _isInMetaMask
  );
}

export function shouldHideFundingWalletChange(): boolean {
  return isInWalletInAppBrowser();
}

export function getInAppBrowserWalletKind(): InAppBrowserWalletKind | null {
  if (isInTokenPocket()) {
    return "tokenpocket";
  }

  if (isInOKApp()) {
    return "okx";
  }

  if (isInBinanceApp()) {
    return "binance";
  }

  if (isInMetaMask()) {
    return "metamask";
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
    const tpParams = {
      action: "open",
      actionId: Date.now() + "",
      callbackUrl: "http://someurl.com", // no need callback
      blockchain: "matic",
      chain: "matic",
      url,
      protocol: "TokenPocket",
      version: "1.0",
    };
    window.location.href = `tpdapp://open?params=${encodeURIComponent(JSON.stringify(tpParams))}`;
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

export function openMetaMaskWallet(params?: { checkOnly?: boolean; }) {
  const { checkOnly = false } = params || {};

  if (isInMobileBrowser() && !isInMetaMask()) {
    if (checkOnly) {
      return true;
    }

    const deepLink =
      "https://link.metamask.io/dapp/" + stripProtocol(window.location.href);
    navigateWalletDeepLink(deepLink);
    return true;
  }

  return false;
}

export function openBinanceWallet(params?: { checkOnly?: boolean; }) {
  const { checkOnly = false } = params || {};

  if (isInMobileBrowser() && !isInBinanceApp()) {
    if (checkOnly) {
      return true;
    }

    navigateWalletDeepLink(buildBinanceWalletDeepLink(window.location.href));
    return true;
  }

  return false;
}
