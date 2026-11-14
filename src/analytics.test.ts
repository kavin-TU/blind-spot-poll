import { describe, expect, it } from "vitest";
import { byBreakdown, byGroup, formatShare, occupationKey, overall, share } from "./analytics";
import { BREAKDOWNS, QUESTIONS, questionById, type Participant } from "./questions";

const q11 = questionById("q11")!; // six options
const generation = BREAKDOWNS.find((b) => b.key === "generation")!;

// generation: index into q02's options (0 = Gen Z, 1 = Millennials, 2 = Gen X)
const person = (gen: number, occupation: string, option?: number): Participant => ({
  id: Math.random().toString(36),
  name: "x",
  phone: "9876543210",
  occupation,
  joinedAt: "",
  answers: { q02: { option: gen, at: "" }, ...(option === undefined ? {} : { q11: { option, at: "" } }) },
});

const people = [
  person(0, "Student", 0),
  person(0, "student ", 0),
  person(0, "STUDENT", 5),
  person(0, "Student"), // joined, never answered q11
  person(1, "Engineer", 3),
];

describe("analytics", () => {
  it("sizes the tally to the question and counts only people who answered", () => {
    const t = overall(people, q11);
    expect(t.total).toBe(4);
    expect(t.counts).toEqual([2, 0, 0, 1, 0, 1]);
    expect(overall(people, questionById("q01")!).counts).toHaveLength(5);
  });

  it("uses each generation's own answers as the denominator", () => {
    const g = byBreakdown(people, q11, generation);
    const z = g.get("Gen Z")!;
    expect(z.total).toBe(3);
    expect(share(z.counts[0], z.total)).toBeCloseTo(2 / 3);
    const m = g.get("Millennials / Gen Y")!;
    expect(share(m.counts[3], m.total)).toBe(1);
  });

  it("shows N/A for a generation with no answers", () => {
    const g = byBreakdown(people, q11, generation);
    const x = g.get("Gen X")!;
    expect(formatShare(share(x.counts[0], x.total))).toBe("N/A");
    expect([...g.keys()]).toEqual(questionById("q02")!.options.map((o) => o.title));
  });

  it("puts people who skipped the breakdown question in their own group", () => {
    const stray: Participant = { ...person(0, "x", 1), answers: { q11: { option: 1, at: "" } } };
    const g = byBreakdown([stray], q11, generation);
    expect(g.get("Not answered")!.counts[1]).toBe(1);
  });

  it("groups free-text occupations ignoring case and spacing", () => {
    const g = byGroup(people, q11, (p) => occupationKey(p.occupation));
    expect(g.get("Student")!.total).toBe(3);
    expect([...g.keys()].sort()).toEqual(["Engineer", "Student"]);
  });

  it("has 4 to 7 options on every question and a valid correct index on fact checks", () => {
    for (const q of QUESTIONS) {
      expect(q.options.length).toBeGreaterThanOrEqual(4);
      expect(q.options.length).toBeLessThanOrEqual(7);
      if (q.correct !== undefined) expect(q.options[q.correct]).toBeDefined();
    }
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
  });
});
