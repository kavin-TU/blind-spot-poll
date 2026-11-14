import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../api";
import {
  GENERATIONS,
  LETTERS,
  OPTION_COLORS,
  QUESTIONS,
  normalizePhone,
  type Generation,
  type Participant,
} from "../questions";

const ID_KEY = "blind-spot-participant";

const readId = () => {
  try {
    return localStorage.getItem(ID_KEY);
  } catch {
    return null;
  }
};
const writeId = (id: string | null) => {
  try {
    if (id) localStorage.setItem(ID_KEY, id);
    else localStorage.removeItem(ID_KEY);
  } catch {
    /* private mode: the session simply won't survive a refresh */
  }
};

export default function Candidate() {
  const [me, setMe] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(() => !!readId());
  const [loadError, setLoadError] = useState("");

  const resume = () => {
    const id = readId();
    if (!id) return setLoading(false);
    setLoading(true);
    setLoadError("");
    api
      .me(id)
      .then(setMe)
      .catch((e: ApiError) => {
        if (e.status === 404) writeId(null); // data was reset: register again
        else setLoadError(e.message);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    resume();
  }, []);

  const next = me ? QUESTIONS.findIndex((q) => !me.answers[q.id]) : -1;

  return (
    <div className="flex min-h-dvh flex-col bg-navy text-cream">
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <span className="text-[11px] font-bold tracking-[0.22em] text-gold">THE NEXTGEN FORUM</span>
        <span className="text-[11px] font-bold tracking-[0.22em] text-cream/60">THE BLIND SPOT</span>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8">
        {loading ? (
          <Centered>Loading…</Centered>
        ) : loadError ? (
          <Centered>
            <p className="mb-4">{loadError}</p>
            <button onClick={resume} className="rounded-xl bg-coral px-6 py-3 font-bold text-white">
              Try again
            </button>
          </Centered>
        ) : !me ? (
          <Register
            onDone={(p) => {
              writeId(p.id);
              setMe(p);
            }}
          />
        ) : next === -1 ? (
          <Done name={me.name} />
        ) : (
          <QuestionCard
            key={QUESTIONS[next].id}
            me={me}
            index={next}
            onAnswered={setMe}
            onLost={() => {
              writeId(null);
              setMe(null);
            }}
          />
        )}
      </main>
      <div className="flex h-2">
        <div className="flex-1 bg-teal" />
        <div className="flex-1 bg-gold" />
        <div className="flex-1 bg-coral" />
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col items-center justify-center text-center text-lg">{children}</div>;
}

const field =
  "w-full rounded-xl border-2 border-navy/15 bg-white px-4 py-3.5 text-[17px] text-navy outline-none focus:border-teal";

function Register({ onDone }: { onDone: (p: Participant) => void }) {
  const [name, setName] = useState("");
  const [generation, setGeneration] = useState("");
  const [phone, setPhone] = useState("");
  const [occupation, setOccupation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Please enter your name.");
    if (!normalizePhone(phone)) return setError("Please enter a valid phone number.");
    if (!generation) return setError("Please choose your generation.");
    if (!occupation.trim()) return setError("Please enter your occupation.");
    setBusy(true);
    setError("");
    try {
      onDone(await api.register(name, phone, generation as Generation, occupation));
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col justify-center">
      <h1 className="mt-4 text-[40px] leading-[1.02] font-black tracking-tight">
        THE
        <br />
        BLIND SPOT
      </h1>
      <p className="mt-3 mb-6 text-lg font-semibold text-teal">What's working that nobody's borrowed?</p>
      <form onSubmit={submit} className="space-y-4 rounded-2xl bg-cream p-5 text-navy" noValidate>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">Your name</span>
          <input
            className={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            autoComplete="name"
            placeholder="e.g. Priya S"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">Phone number</span>
          <input
            className={field}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={20}
            autoComplete="tel"
            placeholder="e.g. 98765 43210"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">Generation</span>
          <select className={field} value={generation} onChange={(e) => setGeneration(e.target.value)}>
            <option value="" disabled>
              Select…
            </option>
            {GENERATIONS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">Occupation</span>
          <input
            className={field}
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            maxLength={60}
            autoComplete="organization-title"
            placeholder="e.g. Student, HR Manager"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm font-semibold text-[#B1484E]">
            {error}
          </p>
        )}
        <button
          disabled={busy}
          className="w-full rounded-xl bg-coral py-4 text-lg font-bold text-white active:scale-[0.99] disabled:opacity-60"
        >
          {busy ? "Joining…" : "Join"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-cream/60">{QUESTIONS.length} quick questions. No account needed.</p>
    </div>
  );
}

function QuestionCard({
  me,
  index,
  onAnswered,
  onLost,
}: {
  me: Participant;
  index: number;
  onAnswered: (p: Participant) => void;
  onLost: () => void;
}) {
  const q = QUESTIONS[index];
  const [choice, setChoice] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const submit = async () => {
    if (choice === null || busy) return;
    setBusy(true);
    setError("");
    try {
      onAnswered(await api.answer(me.id, q.id, choice));
    } catch (err) {
      if ((err as ApiError).status === 404) return onLost();
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-1 mb-4 flex items-center gap-3">
        <div className="flex flex-1 gap-1">
          {QUESTIONS.map((x, i) => (
            <div key={x.id} className={`h-1.5 flex-1 rounded-full ${i <= index ? "bg-gold" : "bg-cream/20"}`} />
          ))}
        </div>
        <span className="text-sm font-bold text-cream/70 tabular-nums">
          {index + 1} / {QUESTIONS.length}
        </span>
      </div>
      <p className="text-[11px] font-bold tracking-[0.2em] text-gold">{q.kicker}</p>
      <h1 className="mt-2 text-[26px] leading-tight font-extrabold">{q.title}</h1>
      <p className="mt-2 text-base text-cream/75">{q.hint}</p>

      <div className="mt-5 space-y-3" role="radiogroup" aria-label={q.title}>
        {q.options.map((o, i) => {
          const on = choice === i;
          return (
            <button
              key={i}
              role="radio"
              aria-checked={on}
              disabled={busy}
              onClick={() => setChoice(i)}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-colors ${
                on ? "border-cream bg-cream text-navy" : "border-cream/20 bg-white/5"
              }`}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-black text-navy"
                style={{ background: OPTION_COLORS[i] }}
              >
                {LETTERS[i]}
              </span>
              <span>
                <span className="block text-[17px] leading-snug font-bold">{o.title}</span>
                {o.sub && (
                  <span className={`mt-0.5 block text-sm leading-snug ${on ? "text-navy/70" : "text-cream/65"}`}>
                    {o.sub}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-semibold text-gold">
          {error}
        </p>
      )}
      <div className="sticky bottom-0 mt-auto bg-navy pt-5 pb-2">
        <button
          onClick={submit}
          disabled={choice === null || busy}
          className="w-full rounded-xl bg-coral py-4 text-lg font-bold text-white disabled:bg-cream/15 disabled:text-cream/40"
        >
          {busy ? "Submitting…" : index === QUESTIONS.length - 1 ? "Submit and finish" : "Submit answer"}
        </button>
        <p className="mt-2 text-center text-xs text-cream/50">Your answer is final once submitted.</p>
      </div>
    </div>
  );
}

function Done({ name }: { name: string }) {
  return (
    <Centered>
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal text-4xl font-black text-navy">
        ✓
      </div>
      <h1 className="text-3xl font-extrabold">Thank you, {name.split(" ")[0]}.</h1>
      <p className="mt-3 text-lg text-cream/75">
        All {QUESTIONS.length} answers are in. Look up — the results will be discussed on the big screen.
      </p>
      <p className="mt-10 border-l-4 border-gold pl-4 text-left text-base text-cream/80 italic">
        “A generation gap is not a verdict. It is a two-way learning opportunity.”
      </p>
    </Centered>
  );
}
