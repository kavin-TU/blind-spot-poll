import type { Generation, Participant } from "./questions";

// Retries are only used for calls that are safe to repeat (an answer is kept
// the first time it lands, so sending it again changes nothing).
async function retrying<T>(path: string, init?: RequestInit): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await call<T>(path, init);
    } catch (e) {
      const status = (e as ApiError).status;
      if (attempt >= 2 || (status !== 0 && status < 500)) throw e;
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/${path}`, init);
  } catch {
    throw new ApiError(0, "No connection. Check your internet and try again.");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? "Something went wrong.");
  return body as T;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const post = (body: unknown, headers: Record<string, string> = {}): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/json", ...headers },
  body: JSON.stringify(body),
});

export const api = {
  register: (name: string, phone: string, generation: Generation, occupation: string) =>
    call<Participant>("register", post({ name, phone, generation, occupation })),
  me: (id: string) => retrying<Participant>(`me?id=${encodeURIComponent(id)}`),
  answer: (id: string, questionId: string, option: number) =>
    retrying<Participant>("answer", post({ id, questionId, option })),
  results: (pin: string) =>
    call<{ participants: Participant[]; at: string }>("results", { headers: { "x-host-pin": pin } }),
  reset: (pin: string) => call<{ deleted: number }>("reset", post({}, { "x-host-pin": pin })),
};
