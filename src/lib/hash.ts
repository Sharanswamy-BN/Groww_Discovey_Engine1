import { createHash } from "crypto";

export function idFor(source: string, raw: string) {
  return `${source}_${createHash("sha1").update(raw).digest("hex").slice(0, 16)}`;
}
