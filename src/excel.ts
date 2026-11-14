import { byBreakdown, byGroup, occupationKey, overall, share, type Tally } from "./analytics";
import { BREAKDOWNS, LETTERS, QUESTIONS, groupOf, labelOf, type Participant } from "./questions";

const NAVY = "FF0F233F";
const CREAM = "FFFAF6EB";

// One % per possible option letter; blank where the question has fewer options.
const pctCells = (t: Tally) => LETTERS.map((_, k) => (k < t.counts.length ? (share(t.counts[k], t.total) ?? "N/A") : ""));

export async function downloadExcel(people: Participant[]) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.created = new Date();

  const sheet = (name: string, columns: { header: string; width: number; pct?: boolean }[]) => {
    const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
    ws.columns = columns.map((c) => ({
      header: c.header,
      width: c.width,
      style: c.pct ? { numFmt: "0.0%", alignment: { horizontal: "right" } } : {},
    }));
    const head = ws.getRow(1);
    head.font = { bold: true, color: { argb: CREAM } };
    head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    head.alignment = { vertical: "middle" };
    head.height = 22;
    return ws;
  };

  const [generation, role, identity] = BREAKDOWNS;
  const who = (p: Participant) => [groupOf(p, identity), groupOf(p, generation), groupOf(p, role)];

  const p1 = sheet("Participant Details", [
    { header: "Participant ID", width: 16 },
    { header: "Name", width: 28 },
    { header: "Phone", width: 18 },
    { header: "Occupation", width: 28 },
    { header: "Identity", width: 22 },
    { header: "Generation", width: 24 },
    { header: "Role", width: 36 },
    { header: "Joined At", width: 22 },
    { header: "Questions Answered", width: 20 },
  ]);
  for (const p of people)
    p1.addRow([p.id, p.name, p.phone ?? "", p.occupation, ...who(p), new Date(p.joinedAt), Object.keys(p.answers).length]);
  p1.getColumn(8).numFmt = "yyyy-mm-dd hh:mm:ss";

  const p2 = sheet("Individual Responses", [
    { header: "Participant ID", width: 16 },
    { header: "Name", width: 28 },
    { header: "Phone", width: 18 },
    { header: "Occupation", width: 28 },
    { header: "Identity", width: 22 },
    { header: "Generation", width: 24 },
    { header: "Role", width: 36 },
    { header: "Question", width: 70 },
    { header: "Selected Option", width: 48 },
    { header: "Correct", width: 10 },
    { header: "Submission Time", width: 22 },
  ]);
  for (const p of people)
    for (const q of QUESTIONS) {
      const a = p.answers[q.id];
      if (!a || !q.options[a.option]) continue;
      p2.addRow([
        p.id,
        p.name,
        p.phone ?? "",
        p.occupation,
        ...who(p),
        labelOf(q),
        `${LETTERS[a.option]}. ${q.options[a.option].title}`,
        q.correct === undefined ? "" : a.option === q.correct ? "Yes" : "No",
        new Date(a.at),
      ]);
    }
  p2.getColumn(11).numFmt = "yyyy-mm-dd hh:mm:ss";

  const p3 = sheet("Overall Results", [
    { header: "Question", width: 70 },
    { header: "Option", width: 48 },
    { header: "Response Count", width: 16 },
    { header: "Percentage", width: 14, pct: true },
    { header: "Total Responses", width: 16 },
    { header: "Correct Answer", width: 15 },
  ]);
  const groupCols = (first: string) => [
    { header: "Question", width: 70 },
    { header: first, width: 36 },
    ...LETTERS.map((l) => ({ header: `Option ${l} %`, width: 13, pct: true })),
    { header: "Responses", width: 12 },
  ];
  const p4 = sheet("Generation Analytics", groupCols("Generation"));
  const p5 = sheet("Role Analytics", groupCols("Role"));
  const p6 = sheet("Identity Analytics", groupCols("Identity"));
  const p7 = sheet("Occupation Analytics", groupCols("Occupation"));

  for (const q of QUESTIONS) {
    const label = labelOf(q);
    const all = overall(people, q);
    q.options.forEach((o, k) =>
      p3.addRow([
        label,
        `${LETTERS[k]}. ${o.title}`,
        all.counts[k],
        share(all.counts[k], all.total) ?? "N/A",
        all.total,
        q.correct === k ? "✓" : "",
      ]),
    );
    if (q.demographic) continue; // its own breakdown is the "share of the room" above
    for (const [g, t] of byBreakdown(people, q, generation)) p4.addRow([label, g, ...pctCells(t), t.total]);
    for (const [g, t] of byBreakdown(people, q, role)) p5.addRow([label, g, ...pctCells(t), t.total]);
    for (const [g, t] of byBreakdown(people, q, identity)) p6.addRow([label, g, ...pctCells(t), t.total]);
    const occ = [...byGroup(people, q, (p) => occupationKey(p.occupation))].sort(
      (a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0]),
    );
    for (const [g, t] of occ) p7.addRow([label, g, ...pctCells(t), t.total]);
  }

  const buf = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `blind-spot-responses-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
