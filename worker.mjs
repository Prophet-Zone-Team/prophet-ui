import openNextWorker, {
  DOQueueHandler,
  DOShardedTagCache,
} from "./.open-next/worker.js";

export default {
  async fetch(request, env, ctx) {
    attachBindingsToGlobalScope(env);
    return openNextWorker.fetch(request, env, ctx);
  },
};

export { DOQueueHandler, DOShardedTagCache };

function attachBindingsToGlobalScope(env) {
  if (!globalThis.process?.env) {
    return;
  }

  for (const [key, value] of Object.entries(env)) {
    if (typeof value === "string") {
      globalThis.process.env[key] = value;
    }
  }
}
