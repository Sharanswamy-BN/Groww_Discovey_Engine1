import { idFor } from "./hash";
import { getSql, migrate } from "./db";
import type { SourceId } from "./types";
import { OTHER_SOURCES_TARGET, PLAY_STORE_TARGET } from "./questions";

const SIP_RE =
  /\b(sip|systematic investment|mutual fund|mutual funds|mf sip|pause sip|stop sip|first sip|instalment|installment|nav|xirr|elss)\b/i;

type Incoming = {
  source: SourceId;
  source_url?: string;
  author_handle?: string;
  posted_at?: string | null;
  title?: string;
  body: string;
  rating?: number | null;
  meta?: Record<string, unknown>;
};

async function countBy(source?: string) {
  const sql = getSql();
  if (source) {
    const rows = await sql`SELECT count(*)::int AS n FROM documents WHERE source = ${source}`;
    return rows[0].n as number;
  }
  const rows = await sql`SELECT count(*)::int AS n FROM documents`;
  return rows[0].n as number;
}

async function otherCount() {
  const sql = getSql();
  const rows = await sql`SELECT count(*)::int AS n FROM documents WHERE source <> 'play_store'`;
  return rows[0].n as number;
}

async function upsertDocs(docs: Incoming[]) {
  const sql = getSql();
  let inserted = 0;
  let skipped = 0;
  for (const d of docs) {
    const body = (d.body || "").trim();
    if (body.length < 20) {
      skipped += 1;
      continue;
    }
    const id = idFor(d.source, `${d.title || ""}|${body}`);
    await sql`
      INSERT INTO documents (id, source, source_url, author_handle, posted_at, title, body, rating, meta)
      VALUES (
        ${id},
        ${d.source},
        ${d.source_url || null},
        ${d.author_handle || null},
        ${d.posted_at || null},
        ${d.title || null},
        ${body},
        ${d.rating ?? null},
        ${JSON.stringify(d.meta || {})}::jsonb
      )
      ON CONFLICT (id) DO NOTHING
    `;
    inserted += 1;
  }
  return { attempted: docs.length, upserted: inserted, skipped };
}

async function fetchJson(url: string, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "GrowwDiscoveryEngine/1.0 (research; student project)",
        Accept: "application/json, text/html",
      },
    });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("json")) return await res.json();
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function redditPosts(listing: any, community: string): Incoming[] {
  const children = listing?.data?.children || [];
  const out: Incoming[] = [];
  for (const c of children) {
    const p = c.data;
    const body = [p.title, p.selftext].filter(Boolean).join("\n\n");
    if (!SIP_RE.test(body)) continue;
    out.push({
      source: "reddit",
      source_url: p.url || `https://www.reddit.com${p.permalink || ""}`,
      author_handle: community,
      posted_at: p.created_utc ? new Date(p.created_utc * 1000).toISOString() : null,
      title: p.title,
      body,
      rating: typeof p.score === "number" ? p.score : null,
      meta: { live: true, community, num_comments: p.num_comments },
    });
  }
  return out;
}

async function ingestReddit(limit: number) {
  if (limit <= 0) return { attempted: 0, upserted: 0, skipped: 0, live_found: 0, errors: [] as string[] };
  const queries = [
    "https://www.reddit.com/r/IndiaInvestments/search.json?q=SIP&restrict_sr=1&sort=relevance&t=all&limit=100",
    "https://www.reddit.com/r/mutualfunds/search.json?q=SIP%20pause%20OR%20stop&restrict_sr=1&sort=relevance&t=all&limit=100",
    "https://www.reddit.com/r/personalfinanceindia/search.json?q=SIP%20mutual%20fund&restrict_sr=1&sort=relevance&t=all&limit=50",
    "https://www.reddit.com/r/GrowwApp/search.json?q=SIP%20OR%20mutual%20fund&restrict_sr=1&sort=new&t=all&limit=50",
  ];
  const collected: Incoming[] = [];
  const errors: string[] = [];
  for (const url of queries) {
    try {
      const json = await fetchJson(url);
      const community = `r/${decodeURIComponent(url.split("/r/")[1].split("/")[0])}`;
      collected.push(...redditPosts(json, community));
    } catch (e) {
      errors.push(String(e));
    }
  }
  return { ...(await upsertDocs(collected.slice(0, limit))), live_found: collected.length, errors };
}

async function ingestAppStore(limit: number) {
  if (limit <= 0) return { attempted: 0, upserted: 0, skipped: 0, live_found: 0, errors: [] as string[] };
  const errors: string[] = [];
  const collected: Incoming[] = [];
  try {
    for (const page of [1, 2, 3, 4, 5]) {
      const json = await fetchJson(
        `https://itunes.apple.com/rss/customerreviews/page=${page}/id=1404871703/sortby=mostrecent/json`
      );
      const entries = json?.feed?.entry || [];
      for (const e of entries) {
        if (!e?.content?.label) continue;
        collected.push({
          source: "app_store",
          source_url:
            "https://apps.apple.com/in/app/groww-stocks-mutual-fund-ipo/id1404871703",
          author_handle: e.author?.name?.label || "App Store",
          posted_at: e.updated?.label || e.published?.label || null,
          title: e.title?.label || "App Store review",
          body: e.content.label,
          rating: Number(e["im:rating"]?.label) || null,
          meta: { live: true, store: "app_store" },
        });
      }
    }
  } catch (e) {
    errors.push(String(e));
  }
  return { ...(await upsertDocs(collected.slice(0, limit))), live_found: collected.length, errors };
}

async function ingestTradingQna(limit: number) {
  if (limit <= 0) return { attempted: 0, upserted: 0, skipped: 0, live_found: 0, errors: [] as string[] };
  const errors: string[] = [];
  const collected: Incoming[] = [];
  const urls = [
    "https://www.reddit.com/r/IndiaInvestments/search.json?q=tradingqna%20SIP&restrict_sr=1&sort=relevance&t=all&limit=25",
    "https://www.reddit.com/search.json?q=site%3Atradingqna.com%20SIP&sort=relevance&t=all&limit=40",
  ];
  try {
    for (const url of urls) {
      const json = await fetchJson(url);
      const children = json?.data?.children || [];
      for (const c of children) {
        const p = c.data;
        const body = [p.title, p.selftext].filter(Boolean).join("\n\n");
        if (body.length < 40) continue;
        collected.push({
          source: "tradingqna",
          source_url: p.url || `https://www.reddit.com${p.permalink || ""}`,
          author_handle: "TradingQ&A / public thread",
          posted_at: p.created_utc ? new Date(p.created_utc * 1000).toISOString() : null,
          title: p.title,
          body,
          rating: typeof p.score === "number" ? p.score : null,
          meta: { live: true, via: "reddit_search" },
        });
      }
    }
  } catch (e) {
    errors.push(String(e));
  }
  return { ...(await upsertDocs(collected.slice(0, limit))), live_found: collected.length, errors };
}

async function ingestYouTube(limit: number) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key || limit <= 0) {
    return {
      attempted: 0,
      upserted: 0,
      skipped: 0,
      live_found: 0,
      errors: key ? [] : ["YOUTUBE_API_KEY not set — skipped"],
    };
  }
  const errors: string[] = [];
  const collected: Incoming[] = [];
  try {
    const search = await fetchJson(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=${encodeURIComponent(
        "SIP mutual fund beginners India"
      )}&key=${key}`
    );
    const ids = (search.items || []).map((i: any) => i.id?.videoId).filter(Boolean);
    for (const id of ids) {
      const comments = await fetchJson(
        `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${id}&maxResults=20&textFormat=plainText&key=${key}`
      );
      for (const item of comments.items || []) {
        const sn = item.snippet?.topLevelComment?.snippet;
        const body = sn?.textDisplay || "";
        if (body.length < 40) continue;
        collected.push({
          source: "youtube",
          source_url: `https://www.youtube.com/watch?v=${id}`,
          author_handle: "YouTube comments",
          posted_at: sn?.publishedAt || null,
          title: "YouTube comment",
          body,
          rating: null,
          meta: { live: true, videoId: id },
        });
      }
    }
  } catch (e) {
    errors.push(String(e));
  }
  return { ...(await upsertDocs(collected.slice(0, limit))), live_found: collected.length, errors };
}

async function ingestPlayStore() {
  const n = await countBy("play_store");
  if (n >= PLAY_STORE_TARGET) {
    return { attempted: 0, upserted: 0, skipped: 0, live_found: 0, total: n, done: true, errors: [] as string[] };
  }
  const sql = getSql();
  const curRows = await sql`SELECT cursor FROM ingest_cursors WHERE source = 'play_store'`;
  let token: string | undefined = curRows[0]?.cursor || undefined;
  const errors: string[] = [];
  const collected: Incoming[] = [];

  try {
    const gplay = (await import("google-play-scraper")).default as any;
    let pages = 0;
    while (pages < 8 && n + collected.length < PLAY_STORE_TARGET) {
      const res = await gplay.reviews({
        appId: "com.nextbillion.groww",
        lang: "en",
        country: "in",
        sort: gplay.sort.NEWEST,
        num: 150,
        paginate: true,
        nextPaginationToken: token,
      });
      for (const r of res.data || []) {
        const body = String(r.text || "").trim();
        if (body.length < 20) continue;
        collected.push({
          source: "play_store",
          source_url: "https://play.google.com/store/apps/details?id=com.nextbillion.groww",
          author_handle: r.userName || "Play Store",
          posted_at: r.date ? new Date(r.date).toISOString() : null,
          title: r.title || "Play Store review",
          body,
          rating: typeof r.score === "number" ? r.score : null,
          meta: { live: true, reply: r.replyText || null },
        });
      }
      token = res.nextPaginationToken || undefined;
      pages += 1;
      if (!token) break;
    }
    await sql`
      INSERT INTO ingest_cursors (source, cursor, updated_at)
      VALUES ('play_store', ${token || null}, NOW())
      ON CONFLICT (source) DO UPDATE SET cursor = EXCLUDED.cursor, updated_at = NOW()
    `;
  } catch (e) {
    errors.push(String(e));
  }

  const result = await upsertDocs(collected);
  const total = await countBy("play_store");
  return { ...result, live_found: collected.length, total, done: total >= PLAY_STORE_TARGET, errors };
}

export async function runIngest() {
  await migrate();
  const play = await ingestPlayStore();
  let slots = Math.max(0, OTHER_SOURCES_TARGET - (await otherCount()));
  const reddit = await ingestReddit(slots);
  slots = Math.max(0, OTHER_SOURCES_TARGET - (await otherCount()));
  const appStore = await ingestAppStore(slots);
  slots = Math.max(0, OTHER_SOURCES_TARGET - (await otherCount()));
  const tradingqna = await ingestTradingQna(slots);
  slots = Math.max(0, OTHER_SOURCES_TARGET - (await otherCount()));
  const youtube = await ingestYouTube(slots);

  const sql = getSql();
  const counts = await sql`
    SELECT source, count(*)::int AS n FROM documents GROUP BY source ORDER BY n DESC
  `;
  const playN = await countBy("play_store");
  const others = await otherCount();
  const runId = `ingest_${Date.now()}`;
  await sql`
    INSERT INTO pipeline_runs (id, kind, status, detail)
    VALUES (
      ${runId},
      'ingest',
      'ok',
      ${JSON.stringify({ play, reddit, appStore, tradingqna, youtube, counts, playN, others })}::jsonb
    )
  `;
  await sql`
    INSERT INTO evidence_log (id, step, method, input_summary, output_summary, quality_checks, extras)
    VALUES (
      ${`ev_${runId}`},
      'ingest',
      'Play Store reviews (paginated, no date cutoff) plus Reddit, App Store, TradingQ&A, optional YouTube',
      ${`Target ${PLAY_STORE_TARGET} Play Store reviews and ${OTHER_SOURCES_TARGET} other-source conversations. Any year kept.`},
      ${`Play Store total ${playN}. Other sources ${others}.`},
      ${JSON.stringify([
        {
          check: "Play Store volume",
          result: playN >= 8000 ? "pass" : "in_progress",
          notes: "Click Collect again until Play Store is 8,000–10,000. Each run fetches another batch.",
        },
        {
          check: "No time filter",
          result: "pass",
          notes: "Reviews from any year are stored.",
        },
        {
          check: "Other sources cap",
          result: others >= 200 ? "pass" : "in_progress",
          notes: `Reddit / App Store / TradingQ&A / YouTube capped around ${OTHER_SOURCES_TARGET}.`,
        },
      ])}::jsonb,
      ${JSON.stringify({ play_errors: play.errors, reddit_errors: reddit.errors, app_errors: appStore.errors })}::jsonb
    )
  `;
  return {
    play_store_total: playN,
    play_store_target: PLAY_STORE_TARGET,
    other_total: others,
    other_target: OTHER_SOURCES_TARGET,
    play,
    reddit,
    appStore,
    tradingqna,
    youtube,
    counts,
    note:
      playN < 8000
        ? "Click Collect again to load the next Play Store batch. Vercel cannot fetch 10,000 reviews in one click."
        : "Play Store target reached.",
  };
}
