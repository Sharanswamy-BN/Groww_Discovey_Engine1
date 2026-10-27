import { NextResponse } from "next/server";
import { envStatus, getSql, migrate } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = envStatus();
  if (!env.database) {
    return NextResponse.json({ env, ready: false, error: "DATABASE_URL missing" });
  }
  try {
    await migrate();
    const sql = getSql();
    const docs = await sql`SELECT count(*)::int AS n FROM documents`;
    const play = await sql`SELECT count(*)::int AS n FROM documents WHERE source = 'play_store'`;
    const other = await sql`SELECT count(*)::int AS n FROM documents WHERE source <> 'play_store'`;
    const analysed = await sql`SELECT count(*)::int AS n FROM document_analyses`;
    const relevant = await sql`
      SELECT count(*)::int AS n FROM document_analyses
      WHERE COALESCE((analysis->>'is_relevant')::boolean, false) = true
    `;
    return NextResponse.json({
      env,
      ready: true,
      counts: {
        documents: docs[0].n,
        play_store: play[0].n,
        other: other[0].n,
        analysed: analysed[0].n,
        relevant: relevant[0].n,
      },
    });
  } catch (e) {
    return NextResponse.json({ env, ready: false, error: String(e) }, { status: 500 });
  }
}
