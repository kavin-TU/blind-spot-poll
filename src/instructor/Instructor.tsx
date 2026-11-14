import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { byGroup, formatShare, overall, share } from "../analytics";
import { api, ApiError } from "../api";
import {
  CornerBlocks,
  DotGrid,
  IconArrowLeft,
  IconArrowRight,
  IconChart,
  IconDownload,
  IconEyeOff,
  IconFlag,
  IconPeople,
  IconTrash,
  TwoSides,
} from "../art";
import {
  GENERATIONS,
  GENERATION_SHORT,
  LETTERS,
  OPTION_COLORS,
  QUESTIONS,
  type Participant,
  type Question,
} from "../questions";

const PIN_KEY = "blind-spot-host-pin";
const VIEW_KEY = "blind-spot-host-view";
const LAST = QUESTIONS.length + 1; // 0 = welcome, 1..N = questions, N+1 = closing

const load = <T,>(storage: Storage, key: string, fallback: T): T => {
  try {
    const v = storage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const save = (storage: Storage, key: string, value: unknown) => {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

export default function Instructor() {
  const [pin, setPin] = useState(() => load<string>(localStorage, PIN_KEY, ""));
  const [people, setPeople] = useState<Participant[] | null>(null);
  const [error, setError] = useState("");
  // Slide position and which results are revealed survive a refresh.
  const [view, setView] = useState(() =>
    load<{ slide: number; revealed: string[] }>(sessionStorage, VIEW_KEY, { slide: 0, revealed: [] }),
  );
  useEffect(() => {
    save(sessionStorage, VIEW_KEY, view);
  }, [view]);

  const refresh = useCallback(async () => {
    if (!pin) return;
    try {
      setPeople((await api.results(pin)).participants);
      setError("");
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 401) {
        setPin("");
        save(localStorage, PIN_KEY, "");
        setPeople(null);
      }
      setError(err.message);
    }
  }, [pin]);

  useEffect(() => {
    if (!pin) return;
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [pin, refresh]);

  const go = useCallback(
    (d: number) => setView((v) => ({ ...v, slide: Math.min(LAST, Math.max(0, v.slide + d)) })),
    [],
  );
  const question = view.slide >= 1 && view.slide <= QUESTIONS.length ? QUESTIONS[view.slide - 1] : null;
  const revealed = !!question && view.revealed.includes(question.id);
  const toggle = useCallback(() => {
    if (!question) return;
    refresh();
    setView((v) => ({
      ...v,
      revealed: v.revealed.includes(question.id)
        ? v.revealed.filter((x) => x !== question.id)
        : [...v.revealed, question.id],
    }));
  }, [question, refresh]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "ArrowRight" || e.key === "PageDown") go(1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") go(-1);
      else if (e.key.toLowerCase() === "r") toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, toggle]);

  if (!pin || people === null)
    return (
      <PinGate
        error={error}
        checking={!!pin && !error}
        onSubmit={(p) => {
          setError("");
          save(localStorage, PIN_KEY, p);
          setPin(p);
        }}
      />
    );

  const finished = people.filter((p) => QUESTIONS.every((q) => p.answers[q.id])).length;
  const light = !!question && view.slide % 2 === 1;

  return (
    <div className={`stage ${light ? "light" : ""}`}>
      {view.slide === 0 ? (
        <Welcome joined={people.length} finished={finished} />
      ) : question ? (
        <QuestionSlide q={question} number={view.slide} people={people} revealed={revealed} />
      ) : (
        <Closing people={people} finished={finished} pin={pin} onReset={() => setView({ slide: 0, revealed: [] })} refresh={refresh} />
      )}

      <div className="bar">
        <div className="controls">
          <button className="btn" onClick={() => go(-1)} disabled={view.slide === 0}>
            <IconArrowLeft />
            Back
          </button>
          {question && (
            <button className={`btn ${revealed ? "" : "primary"}`} onClick={toggle}>
              {revealed ? <IconEyeOff /> : <IconChart />}
              {revealed ? "Hide results" : "Show results"}
            </button>
          )}
          <button
            className={`btn ${!question || revealed ? "primary" : ""}`}
            onClick={() => go(1)}
            disabled={view.slide === LAST}
          >
            {view.slide === 0 ? "Start questions" : view.slide === QUESTIONS.length ? "Finish" : "Next question"}
            <IconArrowRight />
          </button>
        </div>
        <span className="count" role="status">
          {error ? <span className="warn">Connection problem — showing last known data. </span> : null}
          {question
            ? `${overall(people, question.id).total} answered · ${people.length} joined`
            : `${people.length} joined · ${finished} finished`}
        </span>
        <span style={{ flex: 1 }} />
        <TwoSides style={{ height: "1.1em", width: "auto" }} />
        <span className="mark">THE BLIND SPOT</span>
      </div>
      <div className="stripe">
        <div style={{ background: "#009C96" }} />
        <div style={{ background: "#F6BE30" }} />
        <div style={{ background: "#EE634C" }} />
      </div>
    </div>
  );
}

function PinGate({ onSubmit, error, checking }: { onSubmit: (pin: string) => void; error: string; checking: boolean }) {
  const [value, setValue] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim()) onSubmit(value.trim());
  };
  return (
    <div className="stage">
      <CornerBlocks className="art" style={{ top: 0, right: 0, width: "24em" }} />
      <DotGrid className="art" style={{ left: "3em", bottom: "3em", width: "9em", opacity: 0.12 }} />
      <form className="slide" style={{ justifyContent: "center", alignItems: "flex-start" }} onSubmit={submit}>
        <TwoSides style={{ height: "2.6em", width: "auto", marginBottom: "1.2em" }} />
        <div className="kicker">INSTRUCTOR</div>
        <h1 className="headline">The Blind Spot</h1>
        <p className="hint">{checking ? "Checking…" : "Enter the host PIN to open the presenter view."}</p>
        <div style={{ display: "flex", gap: "0.8em", marginTop: "1.6em", alignItems: "center" }}>
          <input
            className="pin"
            type="password"
            aria-label="Host PIN"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button className="btn primary" style={{ fontSize: "1.2em" }}>
            Open
          </button>
        </div>
        {error && (
          <p className="hint warn" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

function Welcome({ joined, finished }: { joined: number; finished: number }) {
  const url = `${window.location.origin}/join`;
  return (
    <div className="welcome">
      <CornerBlocks className="art" style={{ top: 0, right: 0, width: "17em" }} />
      <div style={{ position: "relative" }}>
        <div className="kicker">THE NEXTGEN FORUM | 14 NOVEMBER 2026</div>
        <h1 className="title-xl">
          THE
          <br />
          BLIND SPOT
        </h1>
        <p style={{ fontSize: "1.9em", fontWeight: 700, color: "#009C96", margin: "0.6em 0 0" }}>
          What's working that nobody's borrowed?
        </p>
        <p className="hint" style={{ maxWidth: "22em" }}>
          Scan the code, tell us your generation, and answer {QUESTIONS.length} quick questions on your phone.
        </p>
        <div style={{ display: "flex", gap: "1em", marginTop: "2em" }}>
          <div className="stat-tile">
            <span className="ico" style={{ color: "#F6BE30" }}>
              <IconPeople />
            </span>
            <div>
              <div className="stat" style={{ color: "#F6BE30" }}>
                <span className="bump" key={joined}>
                  {joined}
                </span>
              </div>
              <div className="stat-label">JOINED</div>
            </div>
          </div>
          <div className="stat-tile">
            <span className="ico" style={{ color: "#009C96" }}>
              <IconFlag />
            </span>
            <div>
              <div className="stat" style={{ color: "#009C96" }}>
                <span className="bump" key={finished}>
                  {finished}
                </span>
              </div>
              <div className="stat-label">FINISHED</div>
            </div>
          </div>
        </div>
      </div>
      <DotGrid className="art" style={{ right: "6em", bottom: "4em", width: "11em", opacity: 0.14 }} />
      <div className="qr-card" style={{ position: "relative" }}>
        <QRCodeSVG value={url} size={512} bgColor="#FAF6EB" fgColor="#0F233F" level="M" marginSize={0} />
        <div style={{ fontSize: "0.85em", fontWeight: 700, letterSpacing: "0.2em", marginTop: "1.2em", color: "#5D6570" }}>
          SCAN TO JOIN, OR OPEN
        </div>
        <div style={{ fontSize: "1.35em", fontWeight: 800, marginTop: "0.2em", wordBreak: "break-all" }}>
          {url.replace(/^https?:\/\//, "")}
        </div>
      </div>
    </div>
  );
}

function QuestionSlide({
  q,
  number,
  people,
  revealed,
}: {
  q: Question;
  number: number;
  people: Participant[];
  revealed: boolean;
}) {
  const all = useMemo(() => overall(people, q.id), [people, q.id]);
  const gens = useMemo(() => byGroup(people, q.id, (p) => p.generation, GENERATIONS), [people, q.id]);

  return (
    <div className="slide">
      {!revealed && (
        <DotGrid className="art" style={{ right: "1.6em", bottom: "0.6em", width: "8em", color: "var(--accent)", opacity: 0.22 }} />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
        <span className="kicker">{q.kicker}</span>
        <span style={{ fontWeight: 700, opacity: 0.7 }}>
          {String(number).padStart(2, "0")} / {String(QUESTIONS.length).padStart(2, "0")}
        </span>
      </div>
      <h1 className="headline" style={revealed ? { fontSize: "2.1em", maxWidth: "none" } : undefined}>
        {q.title}
      </h1>
      {!revealed && <p className="hint">{q.hint}</p>}

      {!revealed ? (
        <div className="options">
          {q.options.map((o, i) => (
            <div className="option fade-up" key={i} style={{ ["--opt" as string]: OPTION_COLORS[i], animationDelay: `${i * 60}ms` }}>
              <span className="badge" style={{ background: OPTION_COLORS[i] }}>
                {LETTERS[i]}
              </span>
              <div>
                <div className="option-title">{o.title}</div>
                {o.sub && <div className="option-sub">{o.sub}</div>}
              </div>
            </div>
          ))}
        </div>
      ) : all.total === 0 ? (
        <div className="options" style={{ gridTemplateColumns: "1fr", justifyItems: "center" }}>
          <p className="hint">No answers yet. Results appear here as people submit.</p>
        </div>
      ) : (
        <>
          <div className="results">
            <div className="th" style={{ textAlign: "left" }}>
              {q.hint}
            </div>
            <div className="th">
              Overall<small>{all.total} answers</small>
            </div>
            {GENERATIONS.map((g) => (
              <div className="th" key={g}>
                {GENERATION_SHORT[g]}
                <small>{gens.get(g)!.total} answers</small>
              </div>
            ))}
            {q.options.map((o, i) => {
              const s = share(all.counts[i], all.total);
              const top = all.counts[i] === Math.max(...all.counts);
              return (
                <Row key={i}>
                  <div className="row-main">
                    <span className="badge" style={{ background: OPTION_COLORS[i] }}>
                      {LETTERS[i]}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row-title">
                        {o.title}
                        {top && <span className="tag">Top choice</span>}
                      </div>
                      <div className="track">
                        <div style={{ width: `${(s ?? 0) * 100}%`, background: OPTION_COLORS[i] }} />
                      </div>
                    </div>
                  </div>
                  <div className="big">
                    {formatShare(s)}
                    <small>{all.counts[i]} of {all.total}</small>
                  </div>
                  {GENERATIONS.map((g) => {
                    const t = gens.get(g)!;
                    const gs = share(t.counts[i], t.total);
                    return gs === null ? (
                      <div className="cell na" key={g}>
                        N/A
                      </div>
                    ) : (
                      <div className="cell" key={g} title={`${t.counts[i]} of ${t.total} ${g}`}>
                        <i style={{ height: `${gs * 100}%`, background: OPTION_COLORS[i] }} />
                        <span>{formatShare(gs)}</span>
                      </div>
                    );
                  })}
                </Row>
              );
            })}
          </div>
          <div className="quote">“{q.quote}”</div>
        </>
      )}
    </div>
  );
}

const Row = ({ children }: { children: ReactNode }) => <>{children}</>;

function Closing({
  people,
  finished,
  pin,
  onReset,
  refresh,
}: {
  people: Participant[];
  finished: number;
  pin: string;
  onReset: () => void;
  refresh: () => Promise<void>;
}) {
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  const download = async () => {
    setBusy("excel");
    setMessage("");
    try {
      const fresh = (await api.results(pin)).participants;
      const { downloadExcel } = await import("../excel");
      await downloadExcel(fresh);
    } catch (e) {
      setMessage(`Could not build the Excel file: ${(e as Error).message}`);
    }
    setBusy("");
  };

  const reset = async () => {
    if (
      !window.confirm(
        `Delete all ${people.length} participants and their answers? This cannot be undone. Download the Excel file first if you need the data.`,
      )
    )
      return;
    setBusy("reset");
    try {
      await api.reset(pin);
      await refresh();
      onReset();
    } catch (e) {
      setMessage(`Reset failed: ${(e as Error).message}`);
    }
    setBusy("");
  };

  return (
    <div className="slide" style={{ justifyContent: "center" }}>
      <CornerBlocks className="art" style={{ top: "-2.6em", right: "-4em", width: "18em" }} />
      <div className="quote-mark" aria-hidden="true">
        “
      </div>
      <div className="kicker">THANK YOU</div>
      <h1 className="headline" style={{ fontSize: "3.2em" }}>
        The future doesn't need one generation to win. It needs both generations to become useful to each other.
      </h1>
      <p className="hint">
        {people.length} people joined · {finished} answered every question.
      </p>
      <div style={{ display: "flex", gap: "0.8em", marginTop: "2em", fontSize: "1.2em" }}>
        <button className="btn primary" onClick={download} disabled={!!busy}>
          <IconDownload />
          {busy === "excel" ? "Building…" : "Download Excel"}
        </button>
        <button className="btn" onClick={reset} disabled={!!busy || people.length === 0}>
          <IconTrash />
          {busy === "reset" ? "Deleting…" : "Reset data"}
        </button>
      </div>
      {message && (
        <p className="hint warn" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
