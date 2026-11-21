import "server-only";
import type { NextRequest } from "next/server";

// Fixed-window limiter kept in memory. On Vercel each serverless instance has
// its own memory, so this slows down a single client hammering one instance
// rather than enforcing a global limit. Swap for a shared store (e.g. Upstash
// Redis) if the site gets real traffic.

const windows = new Map<string, { count: number; resetAt: number }>();
const MAX_KEYS = 10_000;

export function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

// Returns true if the request is allowed.
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = windows.get(key);
  if (!entry || now > entry.resetAt) {
    if (windows.size >= MAX_KEYS) {
      for (const [k, v] of windows) if (now > v.resetAt) windows.delete(k);
      if (windows.size >= MAX_KEYS) windows.clear();
    }
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}
