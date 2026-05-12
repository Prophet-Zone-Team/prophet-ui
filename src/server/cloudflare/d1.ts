import type { D1Database } from "../market-history/types";

const D1_BINDING_NAME = "MARKET_HISTORY_DB";

interface CloudflareContext {
  env?: Record<string, unknown>;
}

interface OpenNextCloudflareModule {
  getCloudflareContext?: () => CloudflareContext;
}

interface NextOnPagesModule {
  getRequestContext?: () => CloudflareContext;
}

export async function getCloudflareD1Database(): Promise<D1Database | undefined> {
  const openNextDatabase = await getOpenNextD1Database();

  if (openNextDatabase) {
    return openNextDatabase;
  }

  const nextOnPagesDatabase = await getNextOnPagesD1Database();

  if (nextOnPagesDatabase) {
    return nextOnPagesDatabase;
  }

  const globalDatabase = (globalThis as Record<string, unknown>)[D1_BINDING_NAME];
  return isD1Database(globalDatabase) ? globalDatabase : undefined;
}

async function getOpenNextD1Database(): Promise<D1Database | undefined> {
  try {
    const mod = (await dynamicImport("@opennextjs/cloudflare")) as OpenNextCloudflareModule;
    const context = mod.getCloudflareContext?.();
    const binding = context?.env?.[D1_BINDING_NAME];
    return isD1Database(binding) ? binding : undefined;
  } catch {
    return undefined;
  }
}

async function getNextOnPagesD1Database(): Promise<D1Database | undefined> {
  try {
    const mod = (await dynamicImport("@cloudflare/next-on-pages")) as NextOnPagesModule;
    const context = mod.getRequestContext?.();
    const binding = context?.env?.[D1_BINDING_NAME];
    return isD1Database(binding) ? binding : undefined;
  } catch {
    return undefined;
  }
}

async function dynamicImport(specifier: string): Promise<unknown> {
  const importer = new Function("specifier", "return import(specifier)") as (value: string) => Promise<unknown>;
  return importer(specifier);
}

function isD1Database(value: unknown): value is D1Database {
  return (
    typeof value === "object" &&
    value !== null &&
    "prepare" in value &&
    typeof value.prepare === "function"
  );
}
