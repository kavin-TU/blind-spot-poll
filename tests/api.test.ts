// Runs the real API handler against both storage backends (a real local
// Netlify Blobs server, and the file store used in Docker) and simulates a
// full room of phones answering at once.
import { BlobsServer } from "@netlify/blobs/server";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { overall } from "../src/analytics";
import { QUESTIONS, type Participant } from "../src/questions";
import netlifyHandler from "../netlify/functions/api.mts";
import { fileStore } from "../server/file-store.ts";
import { createHandler } from "../server/handler.ts";

let handler: (req: Request) => Promise<Response>;
let fileHandler: typeof handler;

let server: BlobsServer;
let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "blind-spot-"));
  server = new BlobsServer({ directory: dir, token: "t" });
  const { port } = await server.start();
  const url = `http://localhost:${port}`;
  process.env.NETLIFY_BLOBS_CONTEXT = Buffer.from(
    JSON.stringify({ edgeURL: url, uncachedEdgeURL: url, siteID: "test-site", token: "t" }),
  ).toString("base64");
  process.env.HOST_PIN = "1234";
  fileHandler = createHandler(fileStore(join(dir, "files")), () => "1234");
});

afterAll(async () => {
  await server.stop();
  await rm(dir, { recursive: true, force: true });
});

const call = async (path: string, body?: unknown, pin?: string) => {
  const res = await handler(
    new Request(`https://example.test/api/${path}`, {
      method: body ? "POST" : "GET",
      headers: { "content-type": "application/json", ...(pin ? { "x-host-pin": pin } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    }),
  );
  return { status: res.status, body: await res.json() };
};

describe.each(["Netlify Blobs", "file store"])("api on %s", (backend) => {
  beforeAll(() => {
    handler = backend === "file store" ? fileHandler : netlifyHandler;
  });

  it("validates registration", async () => {
    expect((await call("register", { name: " ", phone: "9876543210", generation: "Gen Z", occupation: "x" })).status).toBe(400);
    expect((await call("register", { name: "A", phone: "9876543210", generation: "Gen Q", occupation: "x" })).status).toBe(400);
    expect((await call("register", { name: "A", phone: "9876543210", generation: "Gen Z", occupation: "" })).status).toBe(400);
    expect((await call("register", { name: "A", generation: "Gen Z", occupation: "x" })).status).toBe(400);
    // Only the plain generation name is accepted, never the label with years.
    expect(
      (await call("register", { name: "A", phone: "9876543210", generation: "Gen Z (1997–2012)", occupation: "x" }))
        .status,
    ).toBe(400);
    expect((await call("register", { name: "A", phone: "12345", generation: "Gen Z", occupation: "x" })).status).toBe(400);
  });

  it("protects results and reset with the host PIN", async () => {
    expect((await call("results")).status).toBe(401);
    expect((await call("results", undefined, "0000")).status).toBe(401);
    expect((await call("reset", {}, "0000")).status).toBe(401);
  });

  it("keeps the first answer and lets a phone resume", async () => {
    const { body: p } = await call("register", {
      name: "Asha",
      phone: " +91 98765-43210 ",
      generation: "Gen X",
      occupation: "Teacher",
    });
    expect(p.phone).toBe("+919876543210");
    await call("answer", { id: p.id, questionId: "q1", option: 2 });
    const again = await call("answer", { id: p.id, questionId: "q1", option: 0 });
    expect(again.body.answers.q1.option).toBe(2);
    expect((await call("answer", { id: p.id, questionId: "q1", option: 9 })).status).toBe(400);
    expect((await call("answer", { id: p.id, questionId: "nope", option: 1 })).status).toBe(400);
    expect((await call(`me?id=${p.id}`)).body.answers.q1.option).toBe(2);
    expect((await call("me?id=P-0000000000")).status).toBe(404);
    await call("reset", {}, "1234");
  });

  it("stores every answer from 200 phones, 50 submitting at the same moment", async () => {
    const gens = ["Gen Z", "Gen Z", "Millennials", "Gen X", "Baby Boomers"];
    const expected = Object.fromEntries(QUESTIONS.map((q) => [q.id, [0, 0, 0, 0]]));
    // 50 requests in flight at any moment: the local Blobs test server refuses
    // connections if all 200 sockets open in the same millisecond.
    let next = 0;
    const worker = async () => {
      while (next < 200) await phone(next++);
    };
    const phone = async (i: number) => {
        const r = await call("register", {
          name: `Person ${i}`,
          phone: `98765${String(10000 + i)}`,
          generation: gens[i % 5],
          occupation: "Student",
        });
        expect(r.status).toBe(201);
        const stopAfter = i % 10 === 0 ? 3 : QUESTIONS.length; // some people drop out early
        for (const q of QUESTIONS.slice(0, stopAfter)) {
          const option = (i * 7 + q.id.charCodeAt(1)) % 4;
          expect((await call("answer", { id: r.body.id, questionId: q.id, option })).status).toBe(200);
          expected[q.id][option]++;
        }
    };
    await Promise.all(Array.from({ length: 50 }, worker));

    const res = await call("results", undefined, "1234");
    const people = res.body.participants as Participant[];
    expect(people).toHaveLength(200);
    for (const q of QUESTIONS) expect(overall(people, q.id).counts).toEqual(expected[q.id]);
    expect(overall(people, "q1").total).toBe(200);
    expect(overall(people, "q7").total).toBe(180);

    expect((await call("reset", {}, "1234")).body.deleted).toBe(200);
    expect((await call("results", undefined, "1234")).body.participants).toHaveLength(0);
  }, 60_000);
});
