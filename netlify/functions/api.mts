import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";
import { createHandler, type Store } from "../../server/handler.ts";
import type { Participant } from "../../src/questions.ts";

// On Netlify, records are kept in Netlify Blobs.
const blobs = () => getStore({ name: "blind-spot", consistency: "strong" });
const store: Store = {
  get: (key) => blobs().get(key, { type: "json" }) as Promise<Participant | null>,
  set: async (key, value) => {
    await blobs().setJSON(key, value);
  },
  list: async (prefix) => (await blobs().list({ prefix })).blobs.map((b) => b.key),
  delete: (key) => blobs().delete(key),
};

const env = globalThis as {
  Netlify?: { env: { get(k: string): string | undefined } };
  process?: { env: Record<string, string | undefined> };
};

export default createHandler(store, () => env.Netlify?.env.get("HOST_PIN") ?? env.process?.env.HOST_PIN);

export const config: Config = { path: "/api/*" };
