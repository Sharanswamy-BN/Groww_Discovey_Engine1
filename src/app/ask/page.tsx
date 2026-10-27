"use client";

import { useState } from "react";

const STARTERS = [
  "What leads first-time investors to pause a SIP?",
  "How do continuers behave differently from drop-offs?",
  "What do people check in the app after starting?",
  "Which unmet need is most tied to 12-month activity?",
];

export default function AskPage() {
  const [q, setQ] = useState(STARTERS[0]);
  const [out, setOut] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function ask() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
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
      <h1 className="text-2xl font-semibold">Ask the engine</h1>
      <p className="text-sm text-groww-muted">
        Answers only from stored analyses. Run collect + extract + synthesize first.
      </p>
      <div className="flex flex-wrap gap-2">
        {STARTERS.map((s) => (
          <button
            key={s}
            onClick={() => setQ(s)}
            className="rounded-full bg-groww-wash px-3 py-1.5 text-xs"
          >
            {s}
          </button>
        ))}
      </div>
      <textarea
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="h-28 w-full rounded-2xl border border-groww-line p-3 text-sm outline-none focus:border-groww-green"
      />
      <button
        onClick={ask}
        disabled={busy}
        className="rounded-full bg-groww-green px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Thinking…" : "Ask"}
      </button>
      {err && <p className="text-sm text-groww-danger">{err}</p>}
      {out && (
        <article className="rounded-2xl border border-groww-line p-5 shadow-card">
          <p className="text-sm leading-6">{out.answer}</p>
          {out.caution && (
            <p className="mt-3 text-xs text-groww-muted">Caution: {out.caution}</p>
          )}
        </article>
      )}
    </div>
  );
}
