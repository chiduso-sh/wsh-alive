import { NextRequest, NextResponse } from "next/server";
import { callEngageAI, UpstreamError, type UpstreamPath } from "@/lib/engageai/server";
import { isFunctionName } from "@/lib/engageai/manifest";

// The browser never chooses an upstream URL, app_id or manifest. It sends one
// of three actions; the server validates it, adds app_id and the API key, and
// forwards it to a fixed EngageAI endpoint. Registration happens server-side.

const MAX_BODY_BYTES = 16 * 1024;
const MAX_MESSAGE_CHARS = 2000;
const MAX_RESULTS = 10;
const SESSION_ID = /^[A-Za-z0-9_-]{8,128}$/;
const CALL_ID = /^[A-Za-z0-9_.:-]{0,128}$/;

type Forward = { path: UpstreamPath; body: Record<string, unknown> };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function sanitizeResult(r: unknown) {
  if (!isObject(r)) return null;
  if (typeof r.call_id !== "string" || !CALL_ID.test(r.call_id)) return null;
  if (!isFunctionName(r.function_name) || typeof r.success !== "boolean") return null;
  if (r.error !== undefined && r.error !== null && typeof r.error !== "string") return null;
  return {
    call_id: r.call_id,
    function_name: r.function_name,
    success: r.success,
    result: r.result ?? null,
    error: typeof r.error === "string" ? r.error.slice(0, 500) : null,
  };
}

// Returns the upstream request, or an error message.
function parse(input: Record<string, unknown>): Forward | string {
  const { action, session_id } = input;
  if (typeof session_id !== "string" || !SESSION_ID.test(session_id)) return "Invalid session_id";

  switch (action) {
    case "chat": {
      const message = typeof input.message === "string" ? input.message.trim() : "";
      if (!message || message.length > MAX_MESSAGE_CHARS) return "Invalid message";
      return { path: "/api/v1/chat", body: { session_id, message } };
    }
    case "results": {
      if (!Array.isArray(input.results) || !input.results.length || input.results.length > MAX_RESULTS) return "Invalid results";
      const results = input.results.map(sanitizeResult);
      if (results.some(r => r === null)) return "Invalid results";
      const key = input.idempotency_key;
      if (typeof key !== "string" || !SESSION_ID.test(key)) return "Invalid idempotency_key";
      return { path: "/api/v1/results", body: { session_id, results, idempotency_key: key } };
    }
    case "confirm": {
      if (typeof input.confirmed !== "boolean") return "Invalid confirmed";
      const callId = input.call_id ?? null;
      if (callId !== null && (typeof callId !== "string" || !CALL_ID.test(callId))) return "Invalid call_id";
      return { path: "/api/v1/confirm", body: { session_id, confirmed: input.confirmed, call_id: callId } };
    }
    default:
      return "Unknown action";
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ error: "Payload too large" }, { status: 413 });

  let input: unknown;
  try { input = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!isObject(input)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const forward = parse(input);
  if (typeof forward === "string") return NextResponse.json({ error: forward }, { status: 400 });

  try {
    return NextResponse.json(await callEngageAI(forward.path, forward.body));
  } catch (err) {
    const status = err instanceof UpstreamError ? err.status : 500;
    console.error(`[EngageAI] ${err instanceof Error ? err.message : "unexpected error"}`);
    // 4xx from EngageAI means our request was wrong, not the visitor's: report it as a 502.
    return NextResponse.json({ error: "Assistant unavailable" }, { status: status === 503 || status === 504 ? status : 502 });
  }
}
