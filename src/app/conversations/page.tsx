"use client";

import { useEffect, useState } from "react";

export default function ConversationsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [source, setSource] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const url = source ? `/api/data?view=documents&source=${source}` : "/api/data?view=documents";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setRows(d.rows || []));
  }, [source]);

  const filtered = rows.filter((r) => {
    if (!q) return true;
    return `${r.title} ${r.body}`.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Conversations</h1>
      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search SIP, pause, mandate…"
          className="w-full max-w-sm rounded-full border border-groww-line px-4 py-2 text-sm outline-none focus:border-groww-green"
        />
        {["", "reddit", "play_store", "app_store", "youtube", "tradingqna", "public_forums"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setSource(s)}
            className={`rounded-full px-3 py-1.5 text-xs ${
              source === s ? "bg-groww-mint font-semibold text-groww-greenDark" : "bg-groww-wash"
            }`}
          >
            {s || "all"}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((r) => {
          const a = r.analysis;
          return (
            <article key={r.id} className="rounded-2xl border border-groww-line p-4 shadow-card">
              <div className="flex flex-wrap items-center gap-2 text-xs text-groww-muted">
                <span className="rounded-full bg-groww-mint px-2 py-0.5 text-groww-greenDark">{r.source}</span>
                {a?.journey_stage && <span>{a.journey_stage}</span>}
                {a?.retention_risk != null && <span>risk {a.retention_risk}/5</span>}
              </div>
              <h2 className="mt-2 text-sm font-semibold">{r.title}</h2>
              <p className="mt-1 text-sm leading-6 text-groww-text">{r.body}</p>
              {a?.summary && (
                <p className="mt-2 text-xs text-groww-muted">Groq: {a.summary}</p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
