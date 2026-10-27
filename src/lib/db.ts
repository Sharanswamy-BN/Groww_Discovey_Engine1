import { neon } from "@neondatabase/serverless";

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is missing. Add your Neon connection string to .env.local");
  }
  return neon(url);
}

export async function migrate() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      source_url TEXT,
      author_handle TEXT,
      posted_at TIMESTAMPTZ,
      title TEXT,
      body TEXT NOT NULL,
      rating INTEGER,
      meta JSONB DEFAULT '{}'::jsonb,
      collected_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS document_analyses (
      document_id TEXT PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
      model TEXT,
      analysis JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS themes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      definition TEXT,
      category TEXT,
      mention_count INTEGER DEFAULT 0,
      pain_count INTEGER DEFAULT 0,
      avg_retention_risk NUMERIC,
      sample_quotes JSONB DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      score NUMERIC,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS evidence_log (
      id TEXT PRIMARY KEY,
      step TEXT NOT NULL,
      method TEXT NOT NULL,
      input_summary TEXT,
      output_summary TEXT,
      quality_checks JSONB DEFAULT '[]'::jsonb,
      model TEXT,
      extras JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS discovery_answers (
      question_key TEXT PRIMARY KEY,
      answer TEXT NOT NULL,
      evidence JSONB DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS pipeline_runs (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      status TEXT NOT NULL,
      detail JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export function envStatus() {
  return {
    database: Boolean(process.env.DATABASE_URL),
    groq: Boolean(process.env.GROQ_API_KEY),
    youtube: Boolean(process.env.YOUTUBE_API_KEY),
  };
}
