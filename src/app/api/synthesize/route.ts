import { NextResponse } from "next/server";
import { clusterThemes, synthesizeOpportunities, validateSample } from "@/lib/analyze";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  try {
    const themes = await clusterThemes();
    const opps = await synthesizeOpportunities();
    const validation = await validateSample();
    return NextResponse.json({ ok: true, themes, opps, validation });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
