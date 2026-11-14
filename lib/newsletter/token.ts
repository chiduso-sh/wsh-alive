import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

// Stateless signed tokens for confirmation and unsubscribe links, so the
// newsletter needs no database: the link itself proves who it was sent to.
// Format: base64url(JSON payload) + "." + base64url(HMAC-SHA256).

type Purpose = "confirm" | "unsubscribe";
type Payload = { p: Purpose; e: string; n?: string; x?: number };

export const CONFIRM_TTL_MS = 48 * 60 * 60 * 1000;

function secret() {
  const value = process.env.NEWSLETTER_SECRET;
  if (!value || value.length < 32) throw new Error("NEWSLETTER_SECRET must be set (32+ characters)");
  return value;
}

function sign(data: string) {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function createToken(purpose: Purpose, email: string, opts: { name?: string; ttlMs?: number } = {}) {
  const payload: Payload = { p: purpose, e: email };
  if (opts.name) payload.n = opts.name;
  if (opts.ttlMs) payload.x = Date.now() + opts.ttlMs;
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

// Returns the email (and name, for confirm tokens) or null if the token is
// forged, for a different purpose, malformed or expired.
export function verifyToken(token: string | null | undefined, purpose: Purpose): { email: string; name?: string } | null {
  if (!token || token.length > 1024) return null;
  const [data, signature, extra] = token.split(".");
  if (!data || !signature || extra !== undefined) return null;

  const expected = Buffer.from(sign(data));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as Payload;
    if (payload.p !== purpose || typeof payload.e !== "string") return null;
    if (payload.x !== undefined && Date.now() > payload.x) return null;
    return { email: payload.e, name: payload.n };
  } catch {
    return null;
  }
}
