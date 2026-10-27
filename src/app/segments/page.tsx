"use client";

import { useEffect, useState } from "react";

function group(rows: any[], key: string) {
  const map = new Map<string, { n: number; risk: number }>();
  for (const r of rows) {
    const k = r[key] || "unknown";
    const cur = map.get(k) || { n: 0, risk: 0 };
    cur.n += 1;
    cur.risk += Number(r.retention_risk) || 0;
    map.set(k, cur);
  }
  return [...map.entries()]
    .map(([k, v]) => ({ k, n: v.n, avg: v.risk / v.n }))
    .sort((a, b) => b.avg - a.avg);
}

export default function SegmentsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  useEffect(() => {
    Promise.all([
      fetch("/api/data?view=segments").then((r) => r.json()),
      fetch("/api/data?view=answers").then((r) => r.json()),
    ]).then(([s, a]) => {
      setRows(s.rows || []);
      setAnswers(a.rows || []);
    });
  }, []);

  const segAnswer = answers.find((a) => a.question_key === "segment_differences");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Segments</h1>
      <p className="text-sm text-groww-muted">
        Inferred only when the conversation says so. Unknown is expected and honest.
      </p>
      {segAnswer && (
        <p className="rounded-2xl bg-groww-mint p-4 text-sm leading-6">{segAnswer.answer}</p>
      )}
      {["income_stability", "influencer", "age_band", "check_frequency"].map((key) => (
        <section key={key} className="rounded-2xl border border-groww-line p-4 shadow-card">
          <h2 className="text-sm font-semibold capitalize">{key.replaceAll("_", " ")}</h2>
          <table className="mt-2 w-full text-left text-sm">
            <thead className="text-xs text-groww-muted">
              <tr>
                <th className="py-1">Value</th>
                <th>n</th>
                <th>Avg risk</th>
              </tr>
            </thead>
            <tbody>
              {group(rows, key).map((g) => (
                <tr key={g.k} className="border-t border-groww-line">
                  <td className="py-2">{g.k}</td>
                  <td>{g.n}</td>
                  <td>{g.avg.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
