import { GENERATIONS, QUESTIONS, type Generation, type Participant } from "../src/questions.ts";

// Where participant records live. One JSON record per participant, keyed
// "p/<id>". A phone only ever writes its own record, so simultaneous
// submissions from many phones cannot collide.
export interface Store {
  get(key: string): Promise<Participant | null>;
  set(key: string, value: Participant): Promise<void>;
  list(prefix: string): Promise<string[]>;
  delete(key: string): Promise<void>;
}

const key = (id: string) => `p/${id}`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
const fail = (status: number, error: string) => json({ error }, status);

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "";

const validId = (v: unknown): v is string => typeof v === "string" && /^P-[a-f0-9]{10}$/.test(v);

export function createHandler(store: Store, hostPin: () => string | undefined) {
  function hostAllowed(req: Request): Response | null {
    const pin = hostPin();
    if (!pin) return fail(503, "HOST_PIN is not set on the server.");
    return req.headers.get("x-host-pin") === pin ? null : fail(401, "Wrong PIN.");
  }

  async function loadAll(): Promise<Participant[]> {
    const keys = await store.list("p/");
    const out: Participant[] = [];
    for (let i = 0; i < keys.length; i += 40) {
      const batch = await Promise.all(keys.slice(i, i + 40).map((k) => store.get(k)));
      for (const p of batch) if (p) out.push(p);
    }
    return out.sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
  }

  return async (req: Request): Promise<Response> => {
  const route = new URL(req.url).pathname.replace(/^\/api\//, "").replace(/\/$/, "");
  const method = req.method;

  try {
    if (route === "register" && method === "POST") {
      const body = await req.json().catch(() => ({}));
      const name = clean(body.name, 60);
      const occupation = clean(body.occupation, 60);
      const generation = body.generation as Generation;
      if (!name) return fail(400, "Please enter your name.");
      if (!GENERATIONS.includes(generation)) return fail(400, "Please choose your generation.");
      if (!occupation) return fail(400, "Please enter your occupation.");

      const p: Participant = {
        id: `P-${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`,
        name,
        generation,
        occupation,
        joinedAt: new Date().toISOString(),
        answers: {},
      };
      await store.set(key(p.id), p);
      return json(p, 201);
    }

    if (route === "me" && method === "GET") {
      const id = new URL(req.url).searchParams.get("id");
      if (!validId(id)) return fail(404, "Not registered.");
      const p = await store.get(key(id));
      return p ? json(p) : fail(404, "Not registered.");
    }

    if (route === "answer" && method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (!validId(body.id)) return fail(404, "Not registered.");
      const question = QUESTIONS.find((q) => q.id === body.questionId);
      if (!question) return fail(400, "Unknown question.");
      if (!Number.isInteger(body.option) || body.option < 0 || body.option > 3)
        return fail(400, "Please choose an option.");

      const p = await store.get(key(body.id));
      if (!p) return fail(404, "Not registered.");
      // Answers are final: a second submission never overwrites the first.
      if (!p.answers[question.id]) {
        p.answers[question.id] = { option: body.option, at: new Date().toISOString() };
        await store.set(key(p.id), p);
      }
      return json(p);
    }

    if (route === "results" && method === "GET") {
      const denied = hostAllowed(req);
      if (denied) return denied;
      return json({ participants: await loadAll(), at: new Date().toISOString() });
    }

    if (route === "reset" && method === "POST") {
      const denied = hostAllowed(req);
      if (denied) return denied;
      const keys = await store.list("p/");
      for (let i = 0; i < keys.length; i += 40)
        await Promise.all(keys.slice(i, i + 40).map((k) => store.delete(k)));
      return json({ deleted: keys.length });
    }

    return fail(404, "Not found.");
  } catch (err) {
    console.error(err);
    return fail(500, "Something went wrong. Please try again.");
  }
  };
}
