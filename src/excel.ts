import { byGroup, occupationKey, overall, share, type Tally } from "./analytics";
import { GENERATIONS, LETTERS, QUESTIONS, type Participant } from "./questions";

const NAVY = "FF0F233F";
const CREAM = "FFFAF6EB";

const pctCells = (t: Tally) => t.counts.map((c) => share(c, t.total) ?? "N/A");

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

  const p1 = sheet("Participant Details", [
    { header: "Participant ID", width: 16 },
    { header: "Name", width: 28 },
    { header: "Phone", width: 18 },
    { header: "Generation", width: 26 },
    { header: "Occupation", width: 28 },
    { header: "Joined At", width: 22 },
    { header: "Questions Answered", width: 20 },
  ]);
  for (const p of people)
    p1.addRow([p.id, p.name, p.phone ?? "", p.generation, p.occupation, new Date(p.joinedAt), Object.keys(p.answers).length]);
  p1.getColumn(6).numFmt = "yyyy-mm-dd hh:mm:ss";

  const p2 = sheet("Individual Responses", [
    { header: "Participant ID", width: 16 },
    { header: "Name", width: 28 },
    { header: "Phone", width: 18 },
    { header: "Generation", width: 26 },
    { header: "Occupation", width: 28 },
    { header: "Question", width: 60 },
    { header: "Selected Option", width: 44 },
    { header: "Submission Time", width: 22 },
  ]);
  for (const p of people)
    for (const [i, q] of QUESTIONS.entries()) {
      const a = p.answers[q.id];
      if (!a) continue;
      p2.addRow([
        p.id,
        p.name,
        p.phone ?? "",
        p.generation,
        p.occupation,
        `Q${i + 1}. ${q.title}`,
        `${LETTERS[a.option]}. ${q.options[a.option].title}`,
        new Date(a.at),
      ]);
    }
  p2.getColumn(8).numFmt = "yyyy-mm-dd hh:mm:ss";

  const p3 = sheet("Overall Results", [
    { header: "Question", width: 60 },
    { header: "Option", width: 44 },
    { header: "Response Count", width: 16 },
    { header: "Percentage", width: 14, pct: true },
    { header: "Total Responses", width: 16 },
  ]);
  const groupCols = (first: string) => [
    { header: "Question", width: 60 },
    { header: first, width: 28 },
    ...LETTERS.map((l) => ({ header: `Option ${l} %`, width: 13, pct: true })),
    { header: "Responses", width: 12 },
  ];
  const p4 = sheet("Generation Analytics", groupCols("Generation"));
  const p5 = sheet("Occupation Analytics", groupCols("Occupation"));

  for (const [i, q] of QUESTIONS.entries()) {
    const label = `Q${i + 1}. ${q.title}`;
    const all = overall(people, q.id);
    q.options.forEach((o, k) =>
      p3.addRow([label, `${LETTERS[k]}. ${o.title}`, all.counts[k], share(all.counts[k], all.total) ?? "N/A", all.total]),
    );
    for (const [g, t] of byGroup(people, q.id, (p) => p.generation, GENERATIONS))
      p4.addRow([label, g, ...pctCells(t), t.total]);
    const occ = [...byGroup(people, q.id, (p) => occupationKey(p.occupation))].sort(
      (a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0]),
    );
    for (const [g, t] of occ) p5.addRow([label, g, ...pctCells(t), t.total]);
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
