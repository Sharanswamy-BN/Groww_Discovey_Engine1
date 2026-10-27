"use client";

import { useEffect, useState } from "react";
import { DISCOVERY_QUESTIONS } from "@/lib/questions";

export default function AskPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string>(DISCOVERY_QUESTIONS[0].text);
  const [out, setOut] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/data?view=answers")
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, string> = {};
        for (const row of d.rows || []) {
          map[row.question_key] = row.answer;
        }
        setAnswers(map);
      });
  }, []);

  async function ask(question: string) {
    setActive(question);
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setOut(json.result);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Ask</h1>
      <p className="text-sm text-groww-muted">
        Use Collect, then Extract, then Themes & opportunities on Overview so
        these questions can be answered from the conversations.
      </p>
      <div className="space-y-3">
        {DISCOVERY_QUESTIONS.map((q) => (
          <article key={q.key} className="rounded-2xl border border-groww-line p-4 shadow-card">
            <p className="text-sm font-semibold">{q.text}</p>
            {answers[q.key] && (
              <p className="mt-2 text-sm leading-6 text-groww-text">{answers[q.key]}</p>
            )}
            <button
              onClick={() => ask(q.text)}
              disabled={busy}
              className="mt-3 rounded-full bg-groww-mint px-3 py-1.5 text-xs font-semibold text-groww-greenDark disabled:opacity-50"
            >
              {busy && active === q.text ? "Answering…" : "Ask"}
            </button>
          </article>
        ))}
      </div>
      {err && <p className="text-sm text-groww-danger">{err}</p>}
      {out && (
        <article className="rounded-2xl border border-groww-line p-5 shadow-card">
          <p className="text-xs text-groww-greenDark">Latest answer</p>
          <p className="mt-2 text-sm leading-6">{out.answer}</p>
          {out.caution && (
            <p className="mt-3 text-xs text-groww-muted">Caution: {out.caution}</p>
          )}
        </article>
      )}
    </div>
  );
}
