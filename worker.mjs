import openNextWorker, {
  DOQueueHandler,
  DOShardedTagCache,
} from "./.open-next/worker.js";

import { collectAllMarketSnapshots } from "./src/server/market-history/collector.ts";
import {
  createScheduledCollectionAlert,
  getScheduledCollectionIssues,
  sendCronAlert,
} from "./src/server/ops/cron-alerts.ts";
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
    const issues = getScheduledCollectionIssues(results);

    if (issues.length > 0) {
      await notifyScheduledCollectionIssue({
        severity: "warning",
        message: issues.join(" "),
        details: results,
      });
    }

    console.log("Scheduled market snapshot collection complete", results);
  } catch (error) {
    console.error("Scheduled market snapshot collection failed", error);
    await notifyScheduledCollectionIssue({
      severity: "critical",
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function notifyScheduledCollectionIssue({ severity, message, details }) {
  try {
    await sendCronAlert(
      createScheduledCollectionAlert({
        severity,
        message,
        details,
      }),
    );
  } catch (alertError) {
    console.error("Scheduled collection alert failed", alertError);
  }
}
