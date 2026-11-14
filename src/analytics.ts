import { groupOf, groupsOf, type Breakdown, type Participant, type Question } from "./questions";

export interface Tally {
  counts: number[]; // one per option of the question
  total: number; // people in this group who answered this question
}

const empty = (n: number): Tally => ({ counts: Array<number>(n).fill(0), total: 0 });

function add(t: Tally, option: number) {
  if (!Number.isInteger(option) || option < 0 || option >= t.counts.length) return;
  t.counts[option]++;
  t.total++;
}

/** Everyone who answered the question. Non-responders are not counted. */
export function overall(people: Participant[], q: Question): Tally {
  const t = empty(q.options.length);
  for (const p of people) {
    const a = p.answers[q.id];
    if (a) add(t, a.option);
  }
  return t;
}

/** One tally per group; the denominator is answers within that group. */
export function byGroup(
  people: Participant[],
  q: Question,
  keyOf: (p: Participant) => string,
  groups?: readonly string[],
): Map<string, Tally> {
  const out = new Map<string, Tally>();
  for (const g of groups ?? []) out.set(g, empty(q.options.length));
  for (const p of people) {
    const a = p.answers[q.id];
    if (!a) continue;
    const g = keyOf(p);
    if (!out.has(g)) out.set(g, empty(q.options.length));
    add(out.get(g)!, a.option);
  }
  return out;
}

/** Tallies split by one of the "who is in the room" answers. */
export const byBreakdown = (people: Participant[], q: Question, b: Breakdown) =>
  byGroup(people, q, (p) => groupOf(p, b), groupsOf(b));

/** Fraction 0-1, or null when the group has no answers (shown as N/A). */
export function share(count: number, total: number): number | null {
  return total === 0 ? null : count / total;
}

export function formatShare(s: number | null): string {
  return s === null ? "N/A" : `${Math.round(s * 100)}%`;
}

/** Free-text occupations grouped case-insensitively, shown in Title Case. */
export function occupationKey(raw: string): string {
  const clean = raw.trim().replace(/\s+/g, " ").toLowerCase();
  if (!clean) return "Not given";
  return clean.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}
