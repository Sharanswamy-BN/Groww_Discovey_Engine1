"use client";

import { useEffect, useState } from "react";
import { RunBar } from "@/components/RunBar";
import Link from "next/link";

export default function OverviewPage() {
  const [status, setStatus] = useState<any>(null);
  const [data, setData] = useState<any>(null);

  async function load() {
    const [s, d] = await Promise.all([
      fetch("/api/status").then((r) => r.json()),
      fetch("/api/data").then((r) => r.json()),
    ]);
    setStatus(s);
    setData(d);
  }

  useEffect(() => {
    load();
  }, []);

  const maxStage = Math.max(1, ...(data?.stages || []).map((x: any) => x.n));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-groww-greenDark">
          Groww Growth · discovery
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-groww-text">
          Why first SIPs go quiet before month 12
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-groww-muted">
          Starting a SIP is easy. Staying is the metric. This engine reads public
          conversations (Play/App Store, Reddit, forums, YouTube) to find the
          user problem behind 12-month SIP activity — without recommending funds
          or using fear.
        </p>
      </div>

      {!status?.env?.database || !status?.env?.groq ? (
        <div className="rounded-2xl border border-groww-line bg-groww-mint p-4 text-sm">
          Keys are not fully set. Open{" "}
          <Link href="/setup" className="font-semibold text-groww-greenDark">
            Setup
          </Link>{" "}
          and add Neon + Groq to <code>.env.local</code>.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Conversations", status?.counts?.documents ?? "—"],
          ["Analysed", status?.counts?.analysed ?? "—"],
          ["SIP-relevant", status?.counts?.relevant ?? "—"],
          ["Opportunities", status?.counts?.opportunities ?? "—"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-groww-line p-4 shadow-card">
            <p className="text-xs text-groww-muted">{k}</p>
            <p className="mt-1 text-2xl font-semibold">{v}</p>
          </div>
        ))}
      </div>

      <RunBar />

      <section className="rounded-2xl border border-groww-line p-5 shadow-card">
        <h2 className="text-sm font-semibold">Underlying user problem</h2>
        <p className="mt-2 text-sm leading-6 text-groww-text">
          {data?.problem?.answer ||
            "Run collect → extract (repeat until analysed catches up) → themes & opportunities. The engine will write the problem statement here from evidence, not from a pre-baked brief."}
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-groww-line p-5 shadow-card">
          <h2 className="text-sm font-semibold">Journey stage mix</h2>
          <div className="mt-3 space-y-2">
            {(data?.stages || []).map((s: any) => (
              <div key={s.stage}>
                <div className="mb-1 flex justify-between text-xs">
                  <span>{s.stage || "unknown"}</span>
                  <span className="text-groww-muted">{s.n}</span>
                </div>
                <div className="bar">
                  <span style={{ width: `${(s.n / maxStage) * 100}%` }} />
                </div>
              </div>
            ))}
            {!data?.stages?.length && (
              <p className="text-sm text-groww-muted">No extractions yet.</p>
            )}
          </div>
        </section>
        <section className="rounded-2xl border border-groww-line p-5 shadow-card">
          <h2 className="text-sm font-semibold">Top themes</h2>
          <ul className="mt-3 space-y-2">
            {(data?.topThemes || []).map((t: any) => (
              <li key={t.name} className="flex items-center justify-between text-sm">
                <span>{t.name}</span>
                <span className="text-xs text-groww-muted">{t.mention_count} mentions</span>
              </li>
            ))}
            {!data?.topThemes?.length && (
              <p className="text-sm text-groww-muted">Run step 3 after extracting.</p>
            )}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-groww-line p-5 shadow-card">
        <h2 className="text-sm font-semibold">Highest-scoring opportunity areas</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {(data?.topOpps || []).map((o: any, i: number) => {
            const p = o.payload || {};
            return (
              <div key={i} className="rounded-xl bg-groww-wash p-4">
                <p className="text-xs text-groww-greenDark">Score {Number(o.score).toFixed(0)}</p>
                <p className="mt-1 text-sm font-semibold">{p.title}</p>
                <p className="mt-2 text-xs leading-5 text-groww-muted">{p.user_problem}</p>
              </div>
            );
          })}
        </div>
        <Link href="/opportunities" className="mt-3 inline-block text-sm font-semibold text-groww-greenDark">
          Compare all opportunities →
        </Link>
      </section>
    </div>
  );
}
