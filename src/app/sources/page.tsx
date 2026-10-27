"use client";

import { useEffect, useState } from "react";

export default function SourcesPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/data").then((r) => r.json()).then(setData);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Sources</h1>
      <p className="max-w-3xl text-sm leading-6 text-groww-muted">
        Only live conversations posted in the last 6 months are kept. Older
        posts and any curated/sample text are dropped on Collect. Sources:
        Reddit (r/IndiaInvestments, r/mutualfunds, r/personalfinanceindia,
        r/GrowwApp), Groww App Store reviews, and YouTube if a key is set.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(data?.sources || []).map((s: any) => (
          <div key={s.source} className="rounded-2xl border border-groww-line p-4 shadow-card">
            <p className="text-xs uppercase tracking-wide text-groww-muted">{s.source}</p>
            <p className="mt-1 text-2xl font-semibold">{s.n}</p>
            <p className="text-xs text-groww-muted">conversations stored</p>
          </div>
        ))}
      </div>
      <ul className="space-y-2 text-sm text-groww-text">
        <li>Play / App Store — first-time UX, mandate, notifications.</li>
        <li>Reddit — why people pause, what they expect, peer advice.</li>
        <li>TradingQ&A-style forums — cashflow, SIP date, review cadence.</li>
        <li>YouTube comments — borrowed motivation from beginner videos.</li>
      </ul>
    </div>
  );
}
