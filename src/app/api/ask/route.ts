import { NextResponse } from "next/server";
import { askEngine } from "@/lib/analyze";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    if (!question) return NextResponse.json({ ok: false, error: "question required" }, { status: 400 });
    const result = await askEngine(question);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
