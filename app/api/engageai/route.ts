import { NextRequest, NextResponse } from "next/server";

const SERVER = "https://engageai-sdk-production.up.railway.app";
const APP_ID = "wsh_alive";
const MAX_BODY_BYTES = 16 * 1024;
const UPSTREAM_TIMEOUT_MS = 30_000;

// Exact-match allowlist. The client never controls the upstream host or path,
// so the API key header can only ever be sent to these three URLs.
const ALLOWED_PATHS = new Set(["/api/v1/register", "/api/v1/chat", "/api/v1/results"]);

type ProxyRequest = { path: string; body: Record<string, unknown> };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

// Returns an error message, or null if the request is acceptable.
// Every call must target this app's own app_id, so the key can't be used
// to register or chat as some other app.
function validate({ path, body }: ProxyRequest): string | null {
  if (path === "/api/v1/register") {
    if (!isObject(body.manifest) || body.manifest.app_id !== APP_ID) return "Invalid manifest";
    return null;
  }
  if (body.app_id !== APP_ID) return "Invalid app_id";
  if (typeof body.session_id !== "string" || body.session_id.length > 128) return "Invalid session_id";
  if (path === "/api/v1/chat") {
    if (typeof body.message !== "string" || !body.message.trim() || body.message.length > 2000) return "Invalid message";
  } else if (!Array.isArray(body.results)) {
    return "Invalid results";
  }
  return null;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_ENGAGEAI_KEY;
  if (!apiKey) {
    console.error("[EngageAI proxy] NEXT_PUBLIC_ENGAGEAI_KEY is not set");
    return NextResponse.json({ error: "Assistant unavailable" }, { status: 503 });
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ error: "Payload too large" }, { status: 413 });

  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return badRequest("Invalid JSON"); }
  if (!isObject(parsed) || typeof parsed.path !== "string" || !isObject(parsed.body)) return badRequest("Invalid request");

  const request: ProxyRequest = { path: parsed.path, body: parsed.body };
  if (!ALLOWED_PATHS.has(request.path)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const invalid = validate(request);
  if (invalid) return badRequest(invalid);

  try {
    const res = await fetch(`${SERVER}${request.path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-EngageAI-Key": apiKey },
      body: JSON.stringify(request.body),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!res.ok) {
      // Log status only: request/response bodies can contain user messages and emails.
      console.error(`[EngageAI proxy] ${request.path} upstream ${res.status}`);
      return NextResponse.json({ error: "Assistant error" }, { status: 502 });
    }

    return NextResponse.json(await res.json());
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === "TimeoutError";
    console.error(`[EngageAI proxy] ${request.path} ${timedOut ? "timed out" : "failed"}`);
    return NextResponse.json({ error: "Assistant unavailable" }, { status: timedOut ? 504 : 502 });
  }
}
