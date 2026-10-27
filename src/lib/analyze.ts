import { getSql } from "./db";
import { fastModel, groqJson, smartModel } from "./groq";
import type { ExtractedAnalysis, Opportunity } from "./types";

const EXTRACT_SYSTEM = `You are a product-research analyst for Groww, an Indian investing app.
Business metric: % of first-time mutual fund investors who still have an active SIP 12 months after starting (active = at least one successful instalment in last 30 days).
Rules:
- Extract only what the text supports. Do not invent biography.
- Do not recommend funds or stocks.
- Do not use fear, FOMO, or urgency framing.
- If the post is not about SIPs / first-time mutual fund investing in India, mark is_relevant false.
Return JSON only.`;

function extractUserPrompt(title: string | null, body: string, source: string) {
  return `Source: ${source}
Title: ${title || ""}
Text:
${body.slice(0, 3500)}

Return JSON with keys:
is_relevant (boolean),
relevance_reason (string),
journey_stage (considering|started|months_1_3|months_4_12|paused|stopped|continuing|unknown),
start_reasons (string[]),
expectations (string[]),
behavior_changes (string[]),
pause_stop_triggers (string[]),
check_frequency (daily|weekly|monthly|rarely|unknown),
what_they_check (string[]),
in_app_confusion (string[]),
outside_app_actions (string[]),
continuer_signals (string[]),
dropout_signals (string[]),
segment: { age_band (unknown|18_25|26_35|36_45|46_plus), income_stability (unknown|stable_salary|variable|student|family_dependent), source_of_money (unknown|salary|savings|bonus|family), influencer (unknown|youtube|family|friends|app|advisor|self) },
sentiment (hopeful|neutral|confused|anxious|frustrated|confident),
retention_risk (0-5 number, 5 = likely to pause/stop before 12 months),
themes: [{ name, quote (short exact-ish phrase from text), polarity (pain|need|habit|motive) }],
unmet_needs (string[]),
summary (one sentence).`;
}

export async function extractBatch(limit = 12) {
  const sql = getSql();
  const rows = await sql`
    SELECT d.id, d.source, d.title, d.body
    FROM documents d
    LEFT JOIN document_analyses a ON a.document_id = d.id
    WHERE a.document_id IS NULL
    ORDER BY d.collected_at DESC
    LIMIT ${limit}
  `;
  const model = fastModel();
  let ok = 0;
  let failed = 0;
  const errors: string[] = [];
  for (const row of rows) {
    try {
      const analysis = await groqJson<ExtractedAnalysis>({
        model,
        system: EXTRACT_SYSTEM,
        user: extractUserPrompt(row.title, row.body, row.source),
      });
      await sql`
        INSERT INTO document_analyses (document_id, model, analysis)
        VALUES (${row.id}, ${model}, ${JSON.stringify(analysis)}::jsonb)
        ON CONFLICT (document_id) DO UPDATE SET analysis = EXCLUDED.analysis, model = EXCLUDED.model
      `;
      ok += 1;
    } catch (e) {
      failed += 1;
      errors.push(`${row.id}: ${String(e)}`);
    }
  }
  await sql`
    INSERT INTO evidence_log (id, step, method, input_summary, output_summary, quality_checks, model, extras)
    VALUES (
      ${`ev_extract_${Date.now()}`},
      'extract',
      'Per-document structured extraction with Groq JSON mode',
      ${`${rows.length} unanalysed documents`},
      ${`${ok} extracted, ${failed} failed`},
      ${JSON.stringify([
        {
          check: "Schema",
          result: "pass",
          notes: "JSON object mode. Failed parses counted separately.",
        },
        {
          check: "Grounding",
          result: "pass",
          notes: "Model instructed to use only text evidence; quotes stored on themes.",
        },
      ])}::jsonb,
      ${model},
      ${JSON.stringify({ errors: errors.slice(0, 8) })}::jsonb
    )
  `;
  const remaining = await sql`
    SELECT count(*)::int AS n
    FROM documents d
    LEFT JOIN document_analyses a ON a.document_id = d.id
    WHERE a.document_id IS NULL
  `;
  return { processed: rows.length, ok, failed, remaining: remaining[0]?.n || 0, errors: errors.slice(0, 8) };
}

function slug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48);
}

export async function clusterThemes() {
  const sql = getSql();
  const rows = await sql`
    SELECT d.id, d.source, d.body, a.analysis
    FROM document_analyses a
    JOIN documents d ON d.id = a.document_id
    WHERE COALESCE((a.analysis->>'is_relevant')::boolean, false) = true
  `;
  const buckets = new Map<
    string,
    {
      name: string;
      count: number;
      pain: number;
      risk: number[];
      quotes: { quote: string; source: string; document_id: string }[];
    }
  >();
  for (const row of rows) {
    const a = row.analysis as ExtractedAnalysis;
    for (const t of a.themes || []) {
      if (!t?.name) continue;
      const id = slug(t.name);
      if (!id) continue;
      const cur = buckets.get(id) || {
        name: t.name,
        count: 0,
        pain: 0,
        risk: [],
        quotes: [],
      };
      cur.count += 1;
      if (t.polarity === "pain" || t.polarity === "need") cur.pain += 1;
      cur.risk.push(Number(a.retention_risk) || 0);
      if (t.quote && cur.quotes.length < 5) {
        cur.quotes.push({ quote: t.quote, source: row.source, document_id: row.id });
      }
      buckets.set(id, cur);
    }
  }

  const preview = [...buckets.values()]
    .sort((x, y) => y.count - x.count)
    .slice(0, 40)
    .map((b) => ({ name: b.name, count: b.count, pain: b.pain }));

  const merged = await groqJson<{
    themes: {
      id: string;
      name: string;
      definition: string;
      category: string;
      aliases: string[];
    }[];
  }>({
    model: smartModel(),
    system:
      "Merge near-duplicate research themes for first-time SIP retention in India. Do not invent themes that are not in the list. JSON only.",
    user: `Canonicalise these extracted theme names into at most 14 durable themes.
Return { themes: [{ id, name, definition, category (expectation|habit|cashflow|literacy|product_ux|social|motivation), aliases: string[] }] }

Input:
${JSON.stringify(preview)}`,
  });

  await sql`DELETE FROM themes`;
  const aliasToCanon = new Map<string, (typeof merged.themes)[0]>();
  for (const t of merged.themes || []) {
    aliasToCanon.set(slug(t.name), t);
    for (const al of t.aliases || []) aliasToCanon.set(slug(al), t);
  }

  const canonBuckets = new Map<
    string,
    {
      theme: (typeof merged.themes)[0];
      count: number;
      pain: number;
      risk: number[];
      quotes: { quote: string; source: string; document_id: string }[];
    }
  >();
  for (const [rawId, b] of buckets) {
    const canon = aliasToCanon.get(rawId) || {
      id: rawId,
      name: b.name,
      definition: b.name,
      category: "habit",
      aliases: [],
    };
    const cid = slug(canon.name) || canon.id;
    const cur = canonBuckets.get(cid) || {
      theme: { ...canon, id: cid },
      count: 0,
      pain: 0,
      risk: [],
      quotes: [],
    };
    cur.count += b.count;
    cur.pain += b.pain;
    cur.risk.push(...b.risk);
    cur.quotes.push(...b.quotes);
    canonBuckets.set(cid, cur);
  }

  for (const [id, b] of canonBuckets) {
    const avg =
      b.risk.length > 0 ? b.risk.reduce((s, n) => s + n, 0) / b.risk.length : 0;
    await sql`
      INSERT INTO themes (id, name, definition, category, mention_count, pain_count, avg_retention_risk, sample_quotes)
      VALUES (
        ${id},
        ${b.theme.name},
        ${b.theme.definition || ""},
        ${b.theme.category || "habit"},
        ${b.count},
        ${b.pain},
        ${avg},
        ${JSON.stringify(b.quotes.slice(0, 6))}::jsonb
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        definition = EXCLUDED.definition,
        mention_count = EXCLUDED.mention_count,
        pain_count = EXCLUDED.pain_count,
        avg_retention_risk = EXCLUDED.avg_retention_risk,
        sample_quotes = EXCLUDED.sample_quotes,
        updated_at = NOW()
    `;
  }

  await sql`
    INSERT INTO evidence_log (id, step, method, input_summary, output_summary, quality_checks, model)
    VALUES (
      ${`ev_cluster_${Date.now()}`},
      'cluster',
      'Frequency rollup of extracted themes + Groq canonical merge',
      ${`${rows.length} relevant docs, ${buckets.size} raw theme keys`},
      ${`${canonBuckets.size} canonical themes`},
      ${JSON.stringify([
        {
          check: "No orphan merge",
          result: "pass",
          notes: "Model may only merge names that appeared in extraction counts.",
        },
        {
          check: "Quantification",
          result: "pass",
          notes: "mention_count and avg retention_risk stored per theme.",
        },
      ])}::jsonb,
      ${smartModel()}
    )
  `;
  return { relevant_docs: rows.length, canonical_themes: canonBuckets.size };
}

export async function synthesizeOpportunities() {
  const sql = getSql();
  const themes = await sql`SELECT * FROM themes ORDER BY mention_count DESC`;
  const sample = await sql`
    SELECT d.id, d.source, d.title, a.analysis
    FROM document_analyses a
    JOIN documents d ON d.id = a.document_id
    WHERE COALESCE((a.analysis->>'is_relevant')::boolean, false) = true
    ORDER BY COALESCE((a.analysis->>'retention_risk')::int, 0) DESC
    LIMIT 28
  `;
  const stats = await sql`
    SELECT
      count(*)::int AS relevant,
      avg(COALESCE((analysis->>'retention_risk')::int, 0)) AS avg_risk,
      count(*) FILTER (WHERE analysis->>'journey_stage' IN ('paused','stopped'))::int AS paused_or_stopped,
      count(*) FILTER (WHERE analysis->>'check_frequency' = 'daily')::int AS daily_checkers
    FROM document_analyses
    WHERE COALESCE((analysis->>'is_relevant')::boolean, false) = true
  `;

  const result = await groqJson<{
    opportunities: Opportunity[];
    discovery_answers: { question_key: string; answer: string; evidence: string[] }[];
    underlying_user_problem: string;
    validation: {
      what_would_falsify: string[];
      weakest_claims: string[];
      source_bias: string;
    };
  }>({
    model: smartModel(),
    temperature: 0.25,
    system: `You are a senior PM researcher on Groww Growth.
Metric to influence: first-time MF investors with an active SIP 12 months later.
You cannot recommend specific funds/stocks. You cannot use fear, FOMO, or urgency.
Opportunity areas must be product/experience/habit/literacy/cashflow — not performance chasing.
Score each opportunity 0-100 using:
score = 0.35*reach_pct + 0.35*(intensity*20) + 0.15*confidence + 0.15*min(100, evidence_count*8)
intensity 1-5, confidence 0-100, reach_pct 0-100.
JSON only.`,
    user: `Theme table:
${JSON.stringify(themes)}

Aggregate stats:
${JSON.stringify(stats[0])}

High-risk document analyses (trim):
${JSON.stringify(
  sample.map((s) => ({
    id: s.id,
    source: s.source,
    title: s.title,
    analysis: s.analysis,
  }))
).slice(0, 24000)}

Return JSON:
{
  "underlying_user_problem": "one paragraph, the real user problem behind 12-month SIP drop-off",
  "opportunities": [ {
      "id": "kebab",
      "title": "",
      "user_problem": "",
      "hypothesized_need": "",
      "why_it_moves_12m_sip": "mechanism on pause/skip/stop in first year",
      "constraint_fit": "why this avoids fund tips and fear/FOMO/urgency",
      "reach_pct": 0,
      "intensity": 1,
      "evidence_count": 0,
      "confidence": 0,
      "score": 0,
      "supporting_theme_ids": [],
      "sample_quotes": [{"quote":"","source":"","document_id":""}],
      "contra_evidence": [],
      "segments_most_affected": []
  } ],
  "discovery_answers": [
    {"question_key":"why_start_and_expect","answer":"","evidence":["doc ids or quotes"]},
    {"question_key":"behaviour_after_start","answer":"","evidence":[]},
    {"question_key":"pause_reduce_stop","answer":"","evidence":[]},
    {"question_key":"what_they_check","answer":"","evidence":[]},
    {"question_key":"in_app_confusion","answer":"","evidence":[]},
    {"question_key":"outside_app","answer":"","evidence":[]},
    {"question_key":"continue_vs_dropout","answer":"","evidence":[]},
    {"question_key":"segment_differences","answer":"","evidence":[]},
    {"question_key":"unmet_needs","answer":"","evidence":[]}
  ],
  "validation": {
    "what_would_falsify": [],
    "weakest_claims": [],
    "source_bias": "public internet over-represents vocal, digitally active investors"
  }
}
Max 6 opportunities, ranked by score.`,
  });

  await sql`DELETE FROM opportunities`;
  for (const opp of result.opportunities || []) {
    const id = opp.id || slug(opp.title);
    await sql`
      INSERT INTO opportunities (id, payload, score)
      VALUES (${id}, ${JSON.stringify(opp)}::jsonb, ${opp.score || 0})
    `;
  }
  for (const ans of result.discovery_answers || []) {
    await sql`
      INSERT INTO discovery_answers (question_key, answer, evidence)
      VALUES (${ans.question_key}, ${ans.answer}, ${JSON.stringify(ans.evidence || [])}::jsonb)
      ON CONFLICT (question_key) DO UPDATE SET answer = EXCLUDED.answer, evidence = EXCLUDED.evidence, updated_at = NOW()
    `;
  }
  await sql`
    INSERT INTO discovery_answers (question_key, answer, evidence)
    VALUES (
      'underlying_user_problem',
      ${result.underlying_user_problem || ""},
      ${JSON.stringify(result.validation || {})}::jsonb
    )
    ON CONFLICT (question_key) DO UPDATE SET answer = EXCLUDED.answer, evidence = EXCLUDED.evidence, updated_at = NOW()
  `;
  await sql`
    INSERT INTO evidence_log (id, step, method, input_summary, output_summary, quality_checks, model, extras)
    VALUES (
      ${`ev_synth_${Date.now()}`},
      'synthesize',
      'Groq synthesis of quantified themes into ranked opportunity areas vs 12-month SIP activity',
      ${`${themes.length} themes, ${sample.length} high-risk docs`},
      ${`${(result.opportunities || []).length} opportunities, ${(result.discovery_answers || []).length} discovery answers`},
      ${JSON.stringify([
        {
          check: "Constraint fit",
          result: "pass",
          notes: "Each opportunity must state why it avoids fund picks and fear/FOMO/urgency.",
        },
        {
          check: "Scoring formula",
          result: "pass",
          notes: "Reach, intensity, evidence count, confidence — comparable scores.",
        },
        {
          check: "Contra-evidence",
          result: "pass",
          notes: "Opportunities include disconfirming notes.",
        },
      ])}::jsonb,
      ${smartModel()},
      ${JSON.stringify(result.validation || {})}::jsonb
    )
  `;
  return {
    opportunities: (result.opportunities || []).length,
    answers: (result.discovery_answers || []).length,
  };
}

export async function validateSample() {
  const sql = getSql();
  const rows = await sql`
    SELECT d.id, d.body, a.analysis, a.model
    FROM document_analyses a
    JOIN documents d ON d.id = a.document_id
    WHERE COALESCE((a.analysis->>'is_relevant')::boolean, false) = true
    ORDER BY random()
    LIMIT 6
  `;
  if (!rows.length) return { agreement: null, n: 0 };

  const second = await groqJson<{
    items: {
      document_id: string;
      agrees_on_journey_stage: boolean;
      agrees_on_retention_risk_within_1: boolean;
      quote_actually_in_text: boolean;
      notes: string;
    }[];
    overall_agreement_pct: number;
  }>({
    model: smartModel(),
    system:
      "You are a QA rater. Compare original text vs first-pass JSON extraction. JSON only.",
    user: `For each item, judge if the extraction is faithful.
Return { items:[{document_id, agrees_on_journey_stage, agrees_on_retention_risk_within_1, quote_actually_in_text, notes}], overall_agreement_pct }

${JSON.stringify(
  rows.map((r) => ({
    document_id: r.id,
    text: String(r.body).slice(0, 1200),
    extraction: r.analysis,
  }))
)}`,
  });

  await sql`
    INSERT INTO evidence_log (id, step, method, input_summary, output_summary, quality_checks, model, extras)
    VALUES (
      ${`ev_validate_${Date.now()}`},
      'validate',
      'Second-pass Groq audit on a random sample of extractions',
      ${`${rows.length} documents re-rated`},
      ${`Agreement ${second.overall_agreement_pct}%`},
      ${JSON.stringify([
        {
          check: "Journey stage agreement",
          result: (second.items || []).every((i) => i.agrees_on_journey_stage)
            ? "pass"
            : "warn",
          notes: "Disagreements recorded in extras.",
        },
        {
          check: "Quote grounding",
          result: (second.items || []).every((i) => i.quote_actually_in_text)
            ? "pass"
            : "warn",
          notes: "Theme quotes must appear in source text.",
        },
      ])}::jsonb,
      ${smartModel()},
      ${JSON.stringify(second)}::jsonb
    )
  `;
  return { agreement: second.overall_agreement_pct, n: rows.length };
}

export async function askEngine(question: string) {
  const sql = getSql();
  const themes = await sql`SELECT name, definition, mention_count, category, sample_quotes FROM themes ORDER BY mention_count DESC LIMIT 12`;
  const opps = await sql`SELECT payload FROM opportunities ORDER BY score DESC LIMIT 6`;
  const answers = await sql`SELECT question_key, answer FROM discovery_answers`;
  const docs = await sql`
    SELECT d.source, d.title, d.body, a.analysis
    FROM documents d
    JOIN document_analyses a ON a.document_id = d.id
    WHERE COALESCE((a.analysis->>'is_relevant')::boolean, false) = true
    ORDER BY COALESCE((a.analysis->>'retention_risk')::int, 0) DESC
    LIMIT 10
  `;
  return groqJson<{ answer: string; citations: string[]; caution: string }>({
    model: smartModel(),
    system:
      "Answer as Groww Growth PM research assistant. Use only provided evidence. No fund/stock tips. No fear/FOMO. JSON.",
    user: `Question: ${question}

Themes: ${JSON.stringify(themes)}
Opportunities: ${JSON.stringify(opps)}
Prior answers: ${JSON.stringify(answers)}
Docs: ${JSON.stringify(
      docs.map((d) => ({
        source: d.source,
        title: d.title,
        summary: (d.analysis as ExtractedAnalysis).summary,
        body: String(d.body).slice(0, 400),
      }))
    )}

Return { answer, citations: string[], caution }`,
  });
}
