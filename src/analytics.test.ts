import { describe, expect, it } from "vitest";
import { byGroup, formatShare, occupationKey, overall, share } from "./analytics";
import { GENERATIONS, type Generation, type Participant } from "./questions";

const person = (generation: Generation, occupation: string, option?: number): Participant => ({
  id: Math.random().toString(36),
  name: "x",
  generation,
  occupation,
  joinedAt: "",
  answers: option === undefined ? {} : { q1: { option, at: "" } },
});

const people = [
  person("Gen Z", "Student", 0),
  person("Gen Z", "student ", 0),
  person("Gen Z", "STUDENT", 1),
  person("Gen Z", "Student"), // joined, never answered
  person("Millennials", "Engineer", 3),
];

describe("analytics", () => {
  it("counts only people who answered", () => {
    const t = overall(people, "q1");
    expect(t.total).toBe(4);
    expect(t.counts).toEqual([2, 1, 0, 1]);
  });

  it("uses each generation's own answers as the denominator", () => {
    const g = byGroup(people, "q1", (p) => p.generation, GENERATIONS);
    const z = g.get("Gen Z")!;
    expect(z.total).toBe(3);
    expect(share(z.counts[0], z.total)).toBeCloseTo(2 / 3);
    expect(share(g.get("Millennials")!.counts[3], g.get("Millennials")!.total)).toBe(1);
  });

  it("shows N/A for a generation with no answers", () => {
    const g = byGroup(people, "q1", (p) => p.generation, GENERATIONS);
    const x = g.get("Gen X")!;
    expect(formatShare(share(x.counts[0], x.total))).toBe("N/A");
  });

  it("groups free-text occupations ignoring case and spacing", () => {
    const g = byGroup(people, "q1", (p) => occupationKey(p.occupation));
    expect(g.get("Student")!.total).toBe(3);
    expect([...g.keys()].sort()).toEqual(["Engineer", "Student"]);
  });
});
