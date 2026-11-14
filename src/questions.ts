// All poll content lives here. Edit the text freely; keep each `id` unchanged
// once people have started answering, because answers are stored against it.

export const LETTERS = ["A", "B", "C", "D", "E", "F", "G"] as const;
// One colour per option letter: the deck's accents, then its quadrant colours.
export const OPTION_COLORS = ["#009C96", "#F6BE30", "#EE634C", "#3770A6", "#32825B", "#B1484E", "#A67119"] as const;

export interface Option {
  title: string;
  sub?: string;
}

export type Section = "WHO IS IN THE ROOM" | "FACT CHECK" | "THE ASK" | "GROUND REALITY" | "BORROWING ECONOMY";

/** Shown on the results slide of a fact-check question. */
export interface Reveal {
  stat: string; // the headline number, e.g. "94%"
  caption: string; // what the number says
  extra?: string[]; // supporting numbers or caveats
  source: string;
}

export interface Question {
  id: string;
  number: string; // deck numbering, e.g. "04"
  section: Section;
  title: string;
  hint: string;
  options: Option[]; // 4 to 7
  correct?: number; // index of the right answer (fact checks only)
  reveal?: Reveal;
  /** "Who is in the room": results show the room's split only, no breakdown. */
  demographic?: boolean;
}

export const kickerOf = (q: Question) => `${q.number} • ${q.section}`;
export const labelOf = (q: Question) => `${q.number}${q.section === "THE ASK" ? "a" : ""}. ${q.title}`;

export const COVER = {
  tagline: "Are we seeing the same reality?",
  sub: "One room. Multiple realities.",
};

export const CLOSING = {
  title:
    "The future won't be built by one generation alone. It will be built by what we are willing to learn from each other.",
  ask: "What can we build together?",
};

const pct = (...values: string[]): Option[] => values.map((title) => ({ title }));

export const QUESTIONS: Question[] = [
  {
    id: "q01",
    number: "01",
    section: "WHO IS IN THE ROOM",
    title: "How do you identify?",
    hint: "Choose the option you are comfortable sharing.",
    options: pct("Male", "Female", "Non-binary", "Prefer to self-describe", "Prefer not to say"),
    demographic: true,
  },
  {
    id: "q02",
    number: "02",
    section: "WHO IS IN THE ROOM",
    title: "Which generation do you belong to?",
    hint: "For this poll, use these commonly used birth-year ranges.",
    options: [
      { title: "Gen Z", sub: "Born 1997–2012" },
      { title: "Millennials / Gen Y", sub: "Born 1981–1996" },
      { title: "Gen X", sub: "Born 1965–1980" },
      { title: "Baby Boomers", sub: "Born 1946–1964" },
      { title: "Other / Prefer not to say" },
    ],
    demographic: true,
  },
  {
    id: "q03",
    number: "03",
    section: "WHO IS IN THE ROOM",
    title: "From which vantage point are you looking at youth and work?",
    hint: "Choose the role that best describes your perspective today.",
    options: pct(
      "Young person / student / early-career",
      "Employer / founder / business leader",
      "Manager / team leader",
      "Educator / academic",
      "Parent / caregiver",
      "Policymaker / social sector",
      "Other",
    ),
    demographic: true,
  },
  {
    id: "q04",
    number: "04",
    section: "FACT CHECK",
    title: "What percentage of Indian Gen Z respondents say on-the-job learning drives career growth?",
    hint: "Vote before the answer is revealed.",
    options: pct("44%", "64%", "94%", "100%"),
    correct: 2,
    reveal: {
      stat: "94%",
      caption: "On-the-job learning is seen as a driver of career growth.",
      source: "Deloitte India Gen Z & Millennial Survey 2025",
    },
  },
  {
    id: "q04a",
    number: "04",
    section: "THE ASK",
    title: "Are we creating enough meaningful opportunities to learn through real work?",
    hint: "Choose the answer closest to your view.",
    options: pct(
      "Yes — most roles offer real learning on the job",
      "Partly — it depends on the manager you get",
      "Rarely — work is assigned, learning is left to chance",
      "No — we still treat learning as a separate programme",
    ),
  },
  {
    id: "q05",
    number: "05",
    section: "FACT CHECK",
    title: "What percentage of Indian Gen Z respondents want more guidance from managers?",
    hint: "Vote first. The reveal includes a second number.",
    options: pct("18%", "38%", "62%", "82%"),
    correct: 2,
    reveal: {
      stat: "62%",
      caption: "want more guidance from managers.",
      extra: [
        "Only 44% say they receive it.",
        "This is a reported experience gap — not proof that every manager is failing.",
      ],
      source: "Deloitte India Gen Z & Millennial Survey 2025",
    },
  },
  {
    id: "q05a",
    number: "05",
    section: "THE ASK",
    title: "Can we expect ownership without providing context, coaching and feedback?",
    hint: "Choose the answer closest to your view.",
    options: pct(
      "Yes — ownership is a personal trait, not a gift",
      "Only from a few self-starters",
      "No — ownership grows where guidance is given",
      "It depends on how clear the goals are",
    ),
  },
  {
    id: "q06",
    number: "06",
    section: "FACT CHECK",
    title: "In rural Tamil Nadu, what percentage of 14–16-year-olds reported knowing how to use a smartphone?",
    hint: "ASER 2024. This is not a statistic about all Gen Alpha.",
    options: pct("47%", "67%", "87%", "97%"),
    correct: 2,
    reveal: {
      stat: "87%",
      caption: "know how to use a smartphone.",
      extra: ["92.2% had a smartphone at home.", "65.3% did an educational activity online in the previous week."],
      source: "ASER 2024 • Rural Tamil Nadu • Ages 14–16",
    },
  },
  {
    id: "q06a",
    number: "06",
    section: "THE ASK",
    title: "Are access, usage and meaningful digital learning the same thing?",
    hint: "Choose the answer closest to your view.",
    options: pct(
      "Yes — access leads naturally to learning",
      "Mostly — usage builds skills over time",
      "No — access and scrolling are not learning",
      "Only with guidance on what to trust and how to use it",
    ),
  },
  {
    id: "q07",
    number: "07",
    section: "GROUND REALITY",
    title: "A young employee is enthusiastic but struggles with consistency. What is most often missing?",
    hint: "Choose what you believe is the most common cause.",
    options: pct(
      "Clarity about expectations",
      "Skills and experience",
      "Motivation and personal discipline",
      "Ownership and accountability",
      "Support, feedback and mentoring",
    ),
  },
  {
    id: "q08",
    number: "08",
    section: "GROUND REALITY",
    title: "Who should make the bigger adjustment to improve the relationship between young employees and workplaces?",
    hint: "Choose one. Be prepared to defend your vote.",
    options: pct(
      "Young people should adapt",
      "Workplaces should adapt",
      "Both must adapt",
      "It depends on person, role and context",
    ),
  },
  {
    id: "q09",
    number: "09",
    section: "GROUND REALITY",
    title: "What is the biggest barrier preventing young people from taking ownership?",
    hint: "Choose the factor you see most often.",
    options: pct(
      "Fear of making mistakes",
      "Not enough decision-making authority",
      "Lack of confidence or competence",
      "Used to being told what to do",
      "Don't see meaning in the work",
    ),
  },
  {
    id: "q10",
    number: "10",
    section: "GROUND REALITY",
    title: "Which statement best reflects your experience of accountability at work?",
    hint: "There is no single correct answer.",
    options: pct(
      "Autonomy expected; accountability resisted",
      "Accountability demanded; autonomy withheld",
      "Both sides struggle with clear expectations",
      "It works when responsibilities and decision rights are clear",
      "It varies too much to generalise",
    ),
  },
  {
    id: "q11",
    number: "11",
    section: "BORROWING ECONOMY",
    title: "If you could introduce ONE practice to improve how young people learn, work and grow, what would it be?",
    hint: "Choose the one intervention you would prioritise.",
    options: pct(
      "Mentorship and regular feedback",
      "Real-world projects with ownership",
      "Peer learning and collaboration",
      "Structured skill-building and apprenticeships",
      "Clear goals, consequences and accountability",
      "Greater autonomy and flexibility",
    ),
  },
];

export const questionById = (id: string) => QUESTIONS.find((q) => q.id === id);

/**
 * Ways to split a result. Each comes from an answer to one of the
 * "who is in the room" questions; `short` are the column headings.
 */
export interface Breakdown {
  key: "generation" | "role" | "identity";
  label: string;
  qid: string;
  short: string[];
}
export const BREAKDOWNS: Breakdown[] = [
  { key: "generation", label: "Generation", qid: "q02", short: ["Gen Z", "Millennials", "Gen X", "Boomers", "Other"] },
  {
    key: "role",
    label: "Role",
    qid: "q03",
    short: ["Young", "Employer", "Manager", "Educator", "Parent", "Policy", "Other"],
  },
  { key: "identity", label: "Identity", qid: "q01", short: ["Male", "Female", "Non-binary", "Self-describe", "Not said"] },
];
export const NOT_ANSWERED = "Not answered";

/** The fixed groups of a breakdown, in option order. */
export const groupsOf = (b: Breakdown): string[] => questionById(b.qid)!.options.map((o) => o.title);

/** Which group a person falls in, from their answer to the breakdown's question. */
export function groupOf(p: Participant, b: Breakdown): string {
  const a = p.answers[b.qid];
  const option = a && questionById(b.qid)!.options[a.option];
  return option ? option.title : NOT_ANSWERED;
}

/** Tidies a typed phone number; returns "" unless it has 7-15 digits. */
export function normalizePhone(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return "";
  return (raw.trim().startsWith("+") ? "+" : "") + digits;
}

export interface Answer {
  option: number; // index into the question's options
  at: string; // server ISO timestamp
}

export interface Participant {
  id: string;
  name: string;
  phone: string; // digits, with an optional leading +
  occupation: string;
  joinedAt: string;
  answers: Record<string, Answer>;
}
