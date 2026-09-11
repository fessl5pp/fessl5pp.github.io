import { AsyncLocalStorage } from "node:async_hooks";

const storage = globalThis.__bellaRequestContextStorageV22 || (globalThis.__bellaRequestContextStorageV22 = new AsyncLocalStorage());

export function runBellaRequestContextV22(context, fn) {
  return storage.run(context && typeof context === "object" ? context : {}, fn);
}

export function getBellaRequestContextV22() {
  return storage.getStore() || {};
}
