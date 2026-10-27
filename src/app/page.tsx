"use client";

import { useEffect, useState } from "react";
import { RunBar } from "@/components/RunBar";

export default function OverviewPage() {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus);
  }, []);

  const play = status?.counts?.play_store ?? "—";
  const other = status?.counts?.other ?? "—";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-groww-text">
          Groww Discovery Engine
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-groww-muted">
          Discovery engine that analyzes customer feedback and conversations
          across App Store, Play Store, Reddit investing communities, Trading
          Q&A forums, and social media to uncover actionable insights
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Conversations", status?.counts?.documents ?? "—"],
          ["Play Store", play],
          ["Other sources", other],
          ["Analysed", status?.counts?.analysed ?? "—"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-groww-line p-4 shadow-card">
            <p className="text-xs text-groww-muted">{k}</p>
            <p className="mt-1 text-2xl font-semibold">{v}</p>
          </div>
        ))}
      </div>

      <RunBar />
    </div>
  );
}
