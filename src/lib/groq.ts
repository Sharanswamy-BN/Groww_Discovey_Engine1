import Groq from "groq-sdk";

export function groqClient() {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY is missing. Add it to .env.local");
  }
  return new Groq({ apiKey: key });
}

export function fastModel() {
  return process.env.GROQ_FAST_MODEL || "openai/gpt-oss-20b";
}

export function smartModel() {
  return process.env.GROQ_SMART_MODEL || "openai/gpt-oss-120b";
}

export async function groqJson<T>(opts: {
  model: string;
  system: string;
  user: string;
  temperature?: number;
}): Promise<T> {
  const groq = groqClient();
  const completion = await groq.chat.completions.create({
    model: opts.model,
    temperature: opts.temperature ?? 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  });
  const raw = completion.choices[0]?.message?.content || "{}";
  return JSON.parse(raw) as T;
}
