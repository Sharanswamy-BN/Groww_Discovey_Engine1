"use client";

import { useEffect, useState } from "react";

export default function EvidencePage() {
  const [rows, setRows] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  useEffect(() => {
    Promise.all([
      fetch("/api/data?view=evidence").then((r) => r.json()),
      fetch("/api/data?view=answers").then((r) => r.json()),
    ]).then(([e, a]) => {
      setRows(e.rows || []);
      setAnswers(a.rows || []);
    });
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">AI Evidence Log</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-groww-muted">
          How data was gathered, how themes were identified, how insights were
          generated, and how quality was checked. This is the audit trail for
          the assignment.
        </p>
      </div>

      <section className="rounded-2xl border border-groww-line p-5 shadow-card">
        <h2 className="text-sm font-semibold">Workflow</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>
            <b>Collect.</b> Live Reddit JSON + App Store RSS + optional YouTube,
            plus a curated SIP corpus so source mix stays ≥2–3 even if a scrape is blocked.
          </li>
          <li>
            <b>Filter.</b> Live items must mention SIP / mutual fund language. IDs are hashed so reruns do not duplicate.
          </li>
          <li>
            <b>Extract.</b> Groq JSON mode tags journey stage, expectations, pause triggers, checking habits, in-app confusion, outside-app behaviour, segments, unmet needs, retention risk.
          </li>
          <li>
            <b>Cluster.</b> Theme names are counted, then Groq merges duplicates into a canonical set with quotes.
          </li>
          <li>
            <b>Score.</b> Opportunity areas are compared on reach, intensity, evidence, and confidence vs the 12-month SIP metric. Each must fit “no fund tips / no fear-FOMO-urgency”.
          </li>
          <li>
            <b>Validate.</b> A second Groq pass audits a random sample for quote grounding and journey-stage agreement.
          </li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Discovery answers</h2>
        {answers
          .filter((a) => a.question_key !== "underlying_user_problem")
          .map((a) => (
            <article key={a.question_key} className="rounded-2xl border border-groww-line p-4">
              <p className="text-xs uppercase tracking-wide text-groww-greenDark">
                {a.question_key.replaceAll("_", " ")}
              </p>
              <p className="mt-1 text-sm leading-6">{a.answer}</p>
            </article>
          ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Run history</h2>
        {rows.map((r) => (
          <article key={r.id} className="rounded-2xl border border-groww-line p-4">
            <div className="flex flex-wrap justify-between gap-2 text-xs text-groww-muted">
              <span className="font-semibold text-groww-text">{r.step}</span>
              <span>{r.created_at}</span>
            </div>
            <p className="mt-1 text-sm">{r.method}</p>
            <p className="mt-1 text-xs text-groww-muted">{r.output_summary}</p>
            <ul className="mt-2 space-y-1">
              {(r.quality_checks || []).map((c: any, i: number) => (
                <li key={i} className="text-xs">
                  <span className="font-semibold">{c.result}</span> · {c.check}: {c.notes}
                </li>
              ))}
            </ul>
          </article>
        ))}
        {!rows.length && <p className="text-sm text-groww-muted">Logs appear after you run the engine.</p>}
      </section>
    </div>
  );
}
