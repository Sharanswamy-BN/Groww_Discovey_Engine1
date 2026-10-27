"use client";

import { useState } from "react";

async function post(url: string, body?: object) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const json = await res.json();
  if (!res.ok || json.ok === false) throw new Error(json.error || "Request failed");
  return json;
}

export function RunBar() {
  const [log, setLog] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    setLog(`${label}…`);
    try {
      const out = await fn();
      setLog(`${label} done.\n${JSON.stringify(out, null, 2).slice(0, 1800)}`);
      setTimeout(() => window.location.reload(), 600);
    } catch (e) {
      setLog(`${label} failed: ${String(e)}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-groww-line bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-groww-text">Run the engine</h2>
          <p className="text-xs text-groww-muted">
            1) Collect conversations  2) Extract with Groq  3) Score opportunities
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={!!busy}
            onClick={() => run("Collect", () => post("/api/ingest"))}
            className="rounded-full bg-groww-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy === "Collect" ? "Collecting…" : "1. Collect"}
          </button>
          <button
            disabled={!!busy}
            onClick={() => run("Extract", () => post("/api/extract", { limit: 8 }))}
            className="rounded-full bg-groww-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy === "Extract" ? "Extracting…" : "2. Extract batch"}
          </button>
          <button
            disabled={!!busy}
            onClick={() => run("Synthesize", () => post("/api/synthesize"))}
            className="rounded-full border border-groww-line px-4 py-2 text-sm font-semibold text-groww-text disabled:opacity-50"
          >
            {busy === "Synthesize" ? "Scoring…" : "3. Themes & opportunities"}
          </button>
        </div>
      </div>
      {log && (
        <pre className="mt-3 max-h-40 overflow-auto rounded-xl bg-groww-wash p-3 text-[11px] leading-5 text-groww-text">
          {log}
        </pre>
      )}
    </section>
  );
}
