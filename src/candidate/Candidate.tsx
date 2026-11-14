import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../api";
import { CheckRing, CornerBlocks, DotGrid, IconBriefcase, IconCheck, IconPeople, IconPhone, IconUser, TwoSides } from "../art";
import {
  GENERATIONS,
  GENERATION_YEARS,
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
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-navy text-cream">
      <header className="relative z-20 flex items-center justify-between px-5 pt-5 pb-3">
        <span className="flex items-center gap-2 text-[11px] font-bold tracking-[0.22em] text-cream/70">
          <TwoSides className="h-4 w-auto" />
          THE BLIND SPOT
        </span>
      </header>
      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8">
        {loading ? (
          <Centered>
            <span className="spinner" role="status" aria-label="Loading" />
          </Centered>
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
      <div className="relative z-10 flex h-1.5">
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
  "w-full rounded-xl border-2 border-navy/10 bg-white py-3.5 pr-4 pl-11 text-[17px] text-navy outline-none transition-shadow placeholder:text-navy/35 focus:border-teal focus:ring-4 focus:ring-teal/15";

/** A labelled form field with a small icon inside the input's left edge. */
function Field({
  label,
  icon,
  hint,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[19px] text-navy/45">
          {icon}
        </span>
        {children}
      </span>
      {hint && <span className="mt-1.5 block text-xs text-navy/55">{hint}</span>}
    </label>
  );
}

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
    <div className="fade-up flex flex-1 flex-col justify-center">
      <CornerBlocks className="pointer-events-none absolute -top-14 -right-5 w-36" />
      <DotGrid className="pointer-events-none absolute bottom-24 -left-6 w-28 text-cream/10" />
      <h1 className="mt-4 text-[40px] leading-[1.02] font-black tracking-tight">
        THE
        <br />
        BLIND SPOT
      </h1>
      <p className="mt-3 mb-6 max-w-[15rem] text-lg leading-snug font-semibold text-teal">
        What's working that nobody's borrowed?
      </p>
      <form
        onSubmit={submit}
        className="space-y-4 rounded-2xl bg-cream p-5 text-navy shadow-[6px_6px_0_0_#EE634C]"
        noValidate
      >
        <Field label="Your name" icon={<IconUser />}>
          <input
            className={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            autoComplete="name"
            placeholder="e.g. Priya S"
          />
        </Field>
        <Field label="Phone number" icon={<IconPhone />}>
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
        </Field>
        <Field label="Generation" icon={<IconPeople />} hint="Years are birth years. Pick the range yours falls in.">
          <select className={`${field} pr-7! text-[15px]!`} value={generation} onChange={(e) => setGeneration(e.target.value)}>
            <option value="" disabled>
              Select…
            </option>
            {GENERATIONS.map((g) => (
              <option key={g} value={g}>
                {GENERATION_YEARS[g] ? `${g} (${GENERATION_YEARS[g]})` : g}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Occupation" icon={<IconBriefcase />}>
          <input
            className={field}
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            maxLength={60}
            autoComplete="organization-title"
            placeholder="e.g. Student, HR Manager"
          />
        </Field>
        {error && (
          <p role="alert" className="rounded-lg bg-[#B1484E]/10 px-3 py-2 text-sm font-semibold text-[#9C3A40]">
            {error}
          </p>
        )}
        <button
          disabled={busy}
          className="w-full rounded-xl bg-navy py-4 text-lg font-bold text-cream transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "Joining…" : "Join"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-cream/60">{QUESTIONS.length} quick questions. No account needed.</p>
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
    <div className="fade-up flex flex-1 flex-col">
      <DotGrid className="pointer-events-none absolute top-14 -right-8 -z-10 w-32 text-cream/[0.07]" />
      <div className="mt-1 mb-5 flex items-center gap-1.5" aria-label={`Question ${index + 1} of ${QUESTIONS.length}`}>
        {QUESTIONS.map((x, i) => (
          <div
            key={x.id}
            className={`flex h-1.5 flex-1 items-center justify-center rounded-full transition-all ${
              i < index ? "bg-teal" : i === index ? "h-6 flex-none basis-9 bg-gold" : "bg-cream/15"
            }`}
          >
            {i === index && <span className="text-xs font-black text-navy tabular-nums">{index + 1}</span>}
          </div>
        ))}
        <span className="ml-1.5 text-xs font-bold text-cream/55 tabular-nums">/ {QUESTIONS.length}</span>
      </div>
      <p className="self-start rounded-full bg-gold/15 px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-gold">
        {q.kicker}
      </p>
      <h1 className="mt-3 text-[26px] leading-tight font-extrabold">{q.title}</h1>
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
              className={`relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border-2 p-3.5 pl-4 text-left transition-all duration-150 active:scale-[0.985] ${
                on ? "border-cream bg-cream text-navy shadow-lg shadow-black/25" : "border-cream/15 bg-white/[0.06]"
              }`}
            >
              <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: OPTION_COLORS[i] }} />
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-black text-navy"
                style={{ background: OPTION_COLORS[i] }}
              >
                {LETTERS[i]}
              </span>
              <span className="flex-1">
                <span className="block text-[17px] leading-snug font-bold">{o.title}</span>
                {o.sub && (
                  <span className={`mt-0.5 block text-sm leading-snug ${on ? "text-navy/70" : "text-cream/65"}`}>
                    {o.sub}
                  </span>
                )}
              </span>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm transition-all ${
                  on ? "scale-100 bg-navy text-cream" : "scale-75 border-2 border-cream/25 text-transparent"
                }`}
              >
                <IconCheck />
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-gold/10 px-3 py-2 text-sm font-semibold text-gold">
          {error}
        </p>
      )}
      <div className="sticky bottom-0 mt-auto bg-navy pt-5 pb-2">
        <button
          onClick={submit}
          disabled={choice === null || busy}
          className="w-full rounded-xl bg-coral py-4 text-lg font-bold text-white shadow-lg shadow-coral/25 transition-all active:scale-[0.98] disabled:bg-cream/10 disabled:text-cream/35 disabled:shadow-none"
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
      <CornerBlocks className="pointer-events-none absolute -top-16 -right-5 w-40" tone="soft" />
      <CheckRing className="mb-6 h-28 w-28" />
      <h1 className="fade-up text-3xl font-extrabold">Thank you, {name.split(" ")[0]}.</h1>
      <p className="fade-up mt-3 text-lg text-cream/75">
        All {QUESTIONS.length} answers are in. Look up — the results will be discussed on the big screen.
      </p>
      <p className="fade-up mt-10 rounded-2xl border border-cream/10 bg-white/[0.05] p-4 pl-5 text-left text-base text-cream/85 italic shadow-[-4px_0_0_0_#F6BE30]">
        “A generation gap is not a verdict. It is a two-way learning opportunity.”
      </p>
    </Centered>
  );
}
