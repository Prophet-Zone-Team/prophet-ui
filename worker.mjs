import openNextWorker, {
  DOQueueHandler,
  DOShardedTagCache,
} from "./.open-next/worker.js";

import { collectAllMarketSnapshots } from "./src/server/market-history/collector.ts";
import { collectAllSignalData } from "./src/server/signal-data/collector.ts";

export default {
  async fetch(request, env, ctx) {
    attachBindingsToGlobalScope(env);
    return openNextWorker.fetch(request, env, ctx);
  },

  async scheduled(_controller, env, ctx) {
    attachBindingsToGlobalScope(env);
    ctx.waitUntil(runScheduledCollection());
  },
};

export { DOQueueHandler, DOShardedTagCache };

function attachBindingsToGlobalScope(env) {
  globalThis.MARKET_HISTORY_DB = env.MARKET_HISTORY_DB;

  if (!globalThis.process?.env) {
    return;
  }

  for (const [key, value] of Object.entries(env)) {
    if (typeof value === "string") {
      globalThis.process.env[key] = value;
    }
  }
}

async function runScheduledCollection() {
  try {
    const [marketResults, signalResults] = await Promise.all([
      collectAllMarketSnapshots(),
      collectAllSignalData(),
    ]);
    const results = {
      market: marketResults,
      signal: signalResults,
    };
    console.log("Scheduled market snapshot collection complete", results);
  } catch (error) {
    console.error("Scheduled market snapshot collection failed", error);
    throw error;
  }
}
