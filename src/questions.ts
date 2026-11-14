// All poll content lives here. Edit the text freely; keep each `id` unchanged
// once people have started answering, because answers are stored against it.

export const GENERATIONS = [
  "Gen Z",
  "Millennials",
  "Gen X",
  "Baby Boomers",
  "Other / Prefer not to say",
] as const;
export type Generation = (typeof GENERATIONS)[number];

export const GENERATION_SHORT: Record<Generation, string> = {
  "Gen Z": "Gen Z",
  Millennials: "Millennials",
  "Gen X": "Gen X",
  "Baby Boomers": "Boomers",
  "Other / Prefer not to say": "Other",
};

export const LETTERS = ["A", "B", "C", "D"] as const;
export const OPTION_COLORS = ["#009C96", "#F6BE30", "#EE634C", "#3770A6"] as const;

export interface Option {
  title: string;
  sub?: string;
}

export interface Question {
  id: string;
  kicker: string;
  title: string;
  hint: string;
  options: [Option, Option, Option, Option];
  quote: string;
}

export const QUESTIONS: Question[] = [
  {
    id: "q1",
    kicker: "01 / THE PREMISE",
    title: "Stop asking which generation is the problem.",
    hint: "A fair conversation examines both sides — with equal curiosity and equal scrutiny.",
    options: [
      { title: "Exchange strengths", sub: "Both doing well — what can each learn from the other?" },
      { title: "Borrow from youth", sub: "Youth strong / workforce weak — what is the workforce missing?" },
      { title: "Borrow from experience", sub: "Youth weak / workforce strong — what should young people learn?" },
      { title: "Build together", sub: "Both struggling — what needs a shared solution?" },
    ],
    quote: "A generation gap is not a verdict. It is a two-way learning opportunity.",
  },
  {
    id: "q2",
    kicker: "02 / QUADRANT 1",
    title: "Both generations are adapting. Faster than the stereotypes.",
    hint: "What is most worth borrowing from each other?",
    options: [
      { title: "Experimenting and learning in public" },
      { title: "Adding context and judgement" },
      { title: "Responsible use of AI" },
      { title: "A shared sense of purpose" },
    ],
    quote: "The young don't own the future of learning. The experienced haven't lost it.",
  },
  {
    id: "q3",
    kicker: "03 / QUADRANT 2",
    title: "The appetite to learn is there. Is the learning relationship?",
    hint: "62% of Gen Z expect guidance from managers; 44% receive it. What closes the gap?",
    options: [
      { title: "Everyday coaching" },
      { title: "Regular feedback" },
      { title: "Stretch assignments" },
      { title: "An annual HR programme" },
    ],
    quote: "Don't ask for initiative and then ration the guidance that helps people grow it.",
  },
  {
    id: "q4",
    kicker: "04 / QUADRANT 3",
    title: "Digital confidence is not the same as job-readiness.",
    hint: "What should young professionals borrow first?",
    options: [
      { title: "Communication" },
      { title: "Prioritisation" },
      { title: "Judgement and stakeholder management" },
      { title: "Consistent execution" },
    ],
    quote: "Confidence gets you into the room. Competence helps you deliver once you're there.",
  },
  {
    id: "q5",
    kicker: "05 / QUADRANT 4",
    title: "The transition from education to work is still a shared problem.",
    hint: "Who must lead on building the bridge?",
    options: [
      { title: "Education" },
      { title: "Employers" },
      { title: "Young people" },
      { title: "All three, co-designing" },
    ],
    quote: "A certificate is not a career. A vacancy is not a pathway. We need the bridge.",
  },
  {
    id: "q6",
    kicker: "06 / TAMIL NADU LENS",
    title: "A smartphone in the home is not the same as digital capability.",
    hint: "Which capability matters most?",
    options: [
      { title: "Evaluating information" },
      { title: "Protecting identity" },
      { title: "Creating and solving" },
      { title: "Digital judgement and wellbeing" },
    ],
    quote: "We have taught a generation to tap. Have we taught them what to trust?",
  },
  {
    id: "q7",
    kicker: "07 / WHAT COULD WE BUILD TOGETHER?",
    title: "Stop transferring generations. Start transferring strengths.",
    hint: "What would you build first?",
    options: [
      { title: "Intergenerational teams" },
      { title: "Real-world projects" },
      { title: "Shared accountability" },
      { title: "Reverse mentoring" },
    ],
    quote:
      "The future doesn't need one generation to win. It needs both generations to become useful to each other.",
  },
];

export interface Answer {
  option: number; // 0-3
  at: string; // server ISO timestamp
}

export interface Participant {
  id: string;
  name: string;
  generation: Generation;
  occupation: string;
  joinedAt: string;
  answers: Record<string, Answer>;
}
