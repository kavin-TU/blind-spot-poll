import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Participant } from "../src/questions.ts";
import type { Store } from "./handler.ts";

/**
 * Keeps each participant as one JSON file in a folder (mount a volume there
 * so the data survives restarts and redeploys).
 */
export function fileStore(dir: string): Store {
  // "p/P-abc123" -> "<dir>/p__P-abc123.json". Keys only ever contain
  // letters, digits, "-" and "/", so this cannot escape the folder.
  const file = (key: string) => {
    if (!/^[A-Za-z0-9/-]+$/.test(key)) throw new Error("Bad key");
    return join(dir, `${key.replace(/\//g, "__")}.json`);
  };
  const ready = mkdir(dir, { recursive: true });

  return {
    async get(key) {
      try {
        return JSON.parse(await readFile(file(key), "utf8")) as Participant;
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw e;
      }
    },
    async set(key, value) {
      await ready;
      // Write to a temp file then rename, so a crash never leaves half a record.
      const tmp = `${file(key)}.${process.pid}.${Date.now()}.tmp`;
      await writeFile(tmp, JSON.stringify(value));
      await rename(tmp, file(key));
    },
    async list(prefix) {
      await ready;
      const start = prefix.replace(/\//g, "__");
      return (await readdir(dir))
        .filter((f) => f.startsWith(start) && f.endsWith(".json"))
        .map((f) => f.slice(0, -5).replace(/__/g, "/"));
    },
    async delete(key) {
      await rm(file(key), { force: true });
    },
  };
}
