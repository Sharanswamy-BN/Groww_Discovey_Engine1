"use client";

import { useEffect, useState } from "react";

export default function ThemesPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/data?view=themes")
      .then((r) => r.json())
      .then((d) => setRows(d.rows || []));
  }, []);
  const max = Math.max(1, ...rows.map((r) => r.mention_count || 0));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Themes</h1>
      <p className="text-sm text-groww-muted">
        Extracted per conversation, then merged into a smaller set you can count and compare.
      </p>
      <div className="space-y-3">
        {rows.map((t) => (
          <article key={t.id} className="rounded-2xl border border-groww-line p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-groww-greenDark">{t.category}</p>
                <h2 className="text-base font-semibold">{t.name}</h2>
              </div>
              <p className="text-sm font-semibold">{t.mention_count}</p>
            </div>
            <p className="mt-1 text-sm text-groww-muted">{t.definition}</p>
            <div className="bar mt-3">
              <span style={{ width: `${(t.mention_count / max) * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-groww-muted">
              Pain/need mentions {t.pain_count} · avg retention risk{" "}
              {Number(t.avg_retention_risk || 0).toFixed(1)}
            </p>
            <ul className="mt-3 space-y-1">
              {(t.sample_quotes || []).slice(0, 3).map((q: any, i: number) => (
                <li key={i} className="text-xs leading-5 text-groww-text">
                  “{q.quote}” <span className="text-groww-muted">({q.source})</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
        {!rows.length && <p className="text-sm text-groww-muted">Run extract, then themes & opportunities.</p>}
      </div>
    </div>
  );
}
