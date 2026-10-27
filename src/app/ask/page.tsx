"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };

export default function AskPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Ask anything about SIPs and first-time investing. I will answer from the collected reviews first.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text?: string) {
    const question = (text ?? input).trim();
    if (!question || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setBusy(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Could not answer");
      setMessages((m) => [...m, { role: "assistant", text: json.result.answer }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `I could not answer that just now. ${String(e)}` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col rounded-2xl border border-groww-line bg-white shadow-card">
      <div className="border-b border-groww-line px-4 py-3">
        <h1 className="text-base font-semibold">Ask</h1>
        <p className="text-xs text-groww-muted">Chat over collected reviews</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
                msg.role === "user"
                  ? "bg-groww-green text-white"
                  : "bg-groww-wash text-groww-text"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-groww-wash px-3.5 py-2.5 text-sm text-groww-muted">
              Looking through reviews…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="flex gap-2 border-t border-groww-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Type or paste a question"
          rows={2}
          className="min-h-[44px] flex-1 resize-none rounded-2xl border border-groww-line px-3 py-2 text-sm outline-none focus:border-groww-green"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="self-end rounded-full bg-groww-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
