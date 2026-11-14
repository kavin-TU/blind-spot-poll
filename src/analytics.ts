import type { Participant } from "./questions";

export interface Tally {
  counts: [number, number, number, number];
  total: number; // people in this group who answered this question
}

const empty = (): Tally => ({ counts: [0, 0, 0, 0], total: 0 });

function add(t: Tally, option: number) {
  if (option < 0 || option > 3) return;
  t.counts[option]++;
  t.total++;
}

/** Everyone who answered the question. Non-responders are not counted. */
export function overall(people: Participant[], qid: string): Tally {
  const t = empty();
  for (const p of people) {
    const a = p.answers[qid];
    if (a) add(t, a.option);
  }
  return t;
}

/** One tally per group; the denominator is answers within that group. */
export function byGroup(
  people: Participant[],
  qid: string,
  groupOf: (p: Participant) => string,
  groups?: readonly string[],
): Map<string, Tally> {
  const out = new Map<string, Tally>();
  for (const g of groups ?? []) out.set(g, empty());
  for (const p of people) {
    const a = p.answers[qid];
    if (!a) continue;
    const g = groupOf(p);
    if (!out.has(g)) out.set(g, empty());
    add(out.get(g)!, a.option);
  }
  return out;
}

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
