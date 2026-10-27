"use client";

import { useEffect, useState } from "react";

export default function OpportunitiesPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/data?view=opportunities")
      .then((r) => r.json())
      .then((d) => setRows(d.rows || []));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Opportunity areas</h1>
      <p className="max-w-3xl text-sm leading-6 text-groww-muted">
        Ranked by reach × intensity × evidence × confidence, against the 12-month
        active SIP metric. These are problem spaces, not shipped solutions.
      </p>
      <div className="space-y-4">
        {rows.map((r) => {
          const p = r.payload || {};
          return (
            <article key={r.id} className="rounded-2xl border border-groww-line p-5 shadow-card">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold">{p.title}</h2>
                <p className="text-sm font-semibold text-groww-greenDark">
                  Score {Number(r.score).toFixed(0)}
                </p>
              </div>
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                <Metric label="Reach" value={`${p.reach_pct}%`} />
                <Metric label="Intensity" value={`${p.intensity}/5`} />
                <Metric label="Confidence" value={`${p.confidence}`} />
              </div>
              <p className="mt-4 text-sm leading-6">
                <b>User problem.</b> {p.user_problem}
              </p>
              <p className="mt-2 text-sm leading-6">
                <b>Need.</b> {p.hypothesized_need}
              </p>
              <p className="mt-2 text-sm leading-6">
                <b>Why it can move 12-month SIP activity.</b> {p.why_it_moves_12m_sip}
              </p>
              <p className="mt-2 text-sm leading-6 text-groww-muted">
                <b>Constraint fit.</b> {p.constraint_fit}
              </p>
              <p className="mt-3 text-xs text-groww-muted">
                Segments: {(p.segments_most_affected || []).join(", ") || "—"}
              </p>
              <ul className="mt-3 space-y-1">
                {(p.sample_quotes || []).slice(0, 3).map((q: any, i: number) => (
                  <li key={i} className="text-xs">
                    “{q.quote}”
                  </li>
                ))}
              </ul>
              {p.contra_evidence?.length ? (
                <p className="mt-3 text-xs text-groww-danger">
                  Contra: {p.contra_evidence.join(" · ")}
                </p>
              ) : null}
            </article>
          );
        })}
        {!rows.length && (
          <p className="text-sm text-groww-muted">
            Complete extract on most conversations, then run step 3.
          </p>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-groww-wash p-3">
      <p className="text-xs text-groww-muted">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}
