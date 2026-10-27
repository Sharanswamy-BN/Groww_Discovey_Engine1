import { NextResponse } from "next/server";
import { getSql, migrate } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        rows: [],
        sources: [],
        stages: [],
        freq: [],
        sentiment: [],
        problem: null,
        topOpps: [],
        topThemes: [],
        error: "DATABASE_URL missing",
      });
    }
    await migrate();
    const sql = getSql();
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view") || "overview";

    if (view === "documents") {
      const source = searchParams.get("source");
      const rows = source
        ? await sql`
            SELECT d.*, a.analysis
            FROM documents d
            LEFT JOIN document_analyses a ON a.document_id = d.id
            WHERE d.source = ${source}
            ORDER BY d.collected_at DESC
            LIMIT 80
          `
        : await sql`
            SELECT d.*, a.analysis
            FROM documents d
            LEFT JOIN document_analyses a ON a.document_id = d.id
            ORDER BY d.collected_at DESC
            LIMIT 80
          `;
      return NextResponse.json({ rows });
    }

    if (view === "themes") {
      const rows = await sql`SELECT * FROM themes ORDER BY mention_count DESC`;
      return NextResponse.json({ rows });
    }

    if (view === "opportunities") {
      const rows = await sql`SELECT * FROM opportunities ORDER BY score DESC`;
      return NextResponse.json({ rows });
    }

    if (view === "evidence") {
      const rows = await sql`SELECT * FROM evidence_log ORDER BY created_at DESC LIMIT 40`;
      return NextResponse.json({ rows });
    }

    if (view === "answers") {
      const rows = await sql`SELECT * FROM discovery_answers`;
      return NextResponse.json({ rows });
    }

    if (view === "segments") {
      const rows = await sql`
        SELECT
          analysis->'segment'->>'income_stability' AS income_stability,
          analysis->'segment'->>'influencer' AS influencer,
          analysis->'segment'->>'age_band' AS age_band,
          analysis->>'journey_stage' AS journey_stage,
          analysis->>'check_frequency' AS check_frequency,
          COALESCE((analysis->>'retention_risk')::int, 0) AS retention_risk
        FROM document_analyses
        WHERE COALESCE((analysis->>'is_relevant')::boolean, false) = true
      `;
      return NextResponse.json({ rows });
    }

    const sources = await sql`
      SELECT source, count(*)::int AS n FROM documents GROUP BY source ORDER BY n DESC
    `;
    const stages = await sql`
      SELECT analysis->>'journey_stage' AS stage, count(*)::int AS n
      FROM document_analyses
      WHERE COALESCE((analysis->>'is_relevant')::boolean, false) = true
      GROUP BY 1 ORDER BY n DESC
    `;
    const freq = await sql`
      SELECT analysis->>'check_frequency' AS freq, count(*)::int AS n
      FROM document_analyses
      WHERE COALESCE((analysis->>'is_relevant')::boolean, false) = true
      GROUP BY 1 ORDER BY n DESC
    `;
    const sentiment = await sql`
      SELECT analysis->>'sentiment' AS sentiment, count(*)::int AS n
      FROM document_analyses
      WHERE COALESCE((analysis->>'is_relevant')::boolean, false) = true
      GROUP BY 1 ORDER BY n DESC
    `;
    const problem = await sql`
      SELECT answer, evidence FROM discovery_answers WHERE question_key = 'underlying_user_problem'
    `;
    const topOpps = await sql`SELECT payload, score FROM opportunities ORDER BY score DESC LIMIT 3`;
    const topThemes = await sql`SELECT name, mention_count, category, avg_retention_risk FROM themes ORDER BY mention_count DESC LIMIT 6`;

    return NextResponse.json({
      sources,
      stages,
      freq,
      sentiment,
      problem: problem[0] || null,
      topOpps,
      topThemes,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
