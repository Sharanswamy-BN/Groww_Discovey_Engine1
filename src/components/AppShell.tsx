"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/sources", label: "Sources" },
  { href: "/conversations", label: "Conversations" },
  { href: "/themes", label: "Themes" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/segments", label: "Segments" },
  { href: "/evidence", label: "Evidence log" },
  { href: "/ask", label: "Ask" },
  { href: "/setup", label: "Setup" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 border-b border-groww-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-groww-green text-sm font-bold text-white">
              G
            </span>
            <span>
              <span className="block text-[15px] font-semibold tracking-tight text-groww-text">
                Groww
              </span>
              <span className="block text-[11px] text-groww-muted">
                SIP Discovery Engine
              </span>
            </span>
          </Link>
          <p className="hidden text-xs text-groww-muted md:block">
            Growth team · 12-month first SIP activity
          </p>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5 pb-2">
          {LINKS.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] ${
                  active
                    ? "bg-groww-mint text-groww-greenDark font-semibold"
                    : "text-groww-muted hover:bg-groww-wash"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-6">{children}</main>
    </div>
  );
}
