import "server-only";

import { fetch as undiciFetch, ProxyAgent, type RequestInit as UndiciRequestInit } from "undici";

let cachedProxyAgent: ProxyAgent | undefined;
let cachedProxyUrl: string | undefined;
let loggedDevelopmentProxy = false;

export async function serverFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const dispatcher = getDevelopmentProxyDispatcher(input);

  if (!dispatcher) {
    return fetch(input, init);
  }

  if (!loggedDevelopmentProxy) {
    loggedDevelopmentProxy = true;
    console.info("[server-fetch] routing outbound requests through development proxy", {
      proxyUrl: cachedProxyUrl,
    });
  }

  return undiciFetch(normalizeFetchInput(input), {
    ...(init as UndiciRequestInit),
    dispatcher,
  }) as unknown as Promise<Response>;
}

function normalizeFetchInput(input: RequestInfo | URL): string | URL {
  if (typeof input === "string" || input instanceof URL) {
    return input;
  }

  return input.url;
}

function getDevelopmentProxyDispatcher(input: RequestInfo | URL) {
  if (process.env.NODE_ENV !== "development") {
    return undefined;
  }

  const proxyUrl = resolveDevelopmentProxyUrl(input);

  if (!proxyUrl || shouldBypassProxy(input)) {
    return undefined;
  }

  if (!cachedProxyAgent || cachedProxyUrl !== proxyUrl) {
    cachedProxyAgent = new ProxyAgent(proxyUrl);
    cachedProxyUrl = proxyUrl;
  }

  return cachedProxyAgent;
}

function resolveDevelopmentProxyUrl(input: RequestInfo | URL) {
  const target = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const isHttps = target.startsWith("https://");

  return (
    (isHttps
      ? process.env.HTTPS_PROXY?.trim() ?? process.env.https_proxy?.trim()
      : undefined) ??
    process.env.HTTP_PROXY?.trim() ??
    process.env.http_proxy?.trim()
  );
}

function shouldBypassProxy(input: RequestInfo | URL) {
  const noProxy = process.env.NO_PROXY?.trim() ?? process.env.no_proxy?.trim();

  if (!noProxy) {
    return false;
  }

  const hostname = getRequestHostname(input);

  if (!hostname) {
    return false;
  }

  return noProxy
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .some((entry) => hostname === entry || hostname.endsWith(`.${entry}`));
}

function getRequestHostname(input: RequestInfo | URL) {
  try {
    const href = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

    return new URL(href).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}
