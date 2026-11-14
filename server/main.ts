// Standalone server for Docker hosts (Dokploy etc.): serves the built site
// from ./dist and the same API the Netlify function exposes, with records
// stored as files in DATA_DIR.
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileStore } from "./file-store.ts";
import { createHandler } from "./handler.ts";

const PORT = Number(process.env.PORT ?? 3000);
const DATA_DIR = resolve(process.env.DATA_DIR ?? "./data");
const DIST = resolve(process.env.DIST_DIR ?? "./dist");

const api = createHandler(fileStore(DATA_DIR), () => process.env.HOST_PIN);

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

async function staticFile(pathname: string): Promise<string | null> {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const full = join(DIST, safe);
  if (!full.startsWith(DIST)) return null;
  try {
    return (await stat(full)).isFile() ? full : null;
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

    if (url.pathname === "/healthz") {
      res.writeHead(200, { "content-type": "text/plain" }).end("ok");
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const c of req) {
        size += (c as Buffer).length;
        if (size > 16_384) {
          res.writeHead(413).end();
          return;
        }
        chunks.push(c as Buffer);
      }
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
      const hasBody = req.method !== "GET" && req.method !== "HEAD";
      const out = await api(
        new Request(url, { method: req.method, headers, body: hasBody ? Buffer.concat(chunks) : undefined }),
      );
      res.writeHead(out.status, Object.fromEntries(out.headers)).end(await out.text());
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405).end();
      return;
    }

    // Real files are served as-is; every other path is the single-page app.
    const file = (await staticFile(url.pathname)) ?? join(DIST, "index.html");
    const hashed = url.pathname.startsWith("/assets/");
    res.writeHead(200, {
      "content-type": TYPES[extname(file)] ?? "application/octet-stream",
      "cache-control": hashed ? "public, max-age=31536000, immutable" : "no-cache",
    });
    if (req.method === "HEAD") res.end();
    else createReadStream(file).pipe(res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Something went wrong. Please try again." }));
  }
});

server.listen(PORT, () => {
  console.log(`Blind Spot poll listening on :${PORT}, data in ${DATA_DIR}`);
  if (!process.env.HOST_PIN) console.warn("HOST_PIN is not set: the presenter view will not open.");
});

for (const sig of ["SIGTERM", "SIGINT"] as const) process.on(sig, () => server.close(() => process.exit(0)));
