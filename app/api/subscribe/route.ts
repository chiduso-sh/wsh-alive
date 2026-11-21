import { NextRequest, NextResponse } from "next/server";
import { PENDING_MESSAGE, requestSubscription } from "@/lib/newsletter/subscribe";
import { clientIp } from "@/lib/rate-limit";

const MAX_BODY_BYTES = 2 * 1024;
const PENDING = { status: "pending", message: PENDING_MESSAGE };

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return error("Request too large.", 413);

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return error("Invalid request.", 400);
  }
  if (typeof body !== "object" || body === null) return error("Invalid request.", 400);

  // Honeypot: the form hides this field from people, so only bots fill it.
  // Pretend it worked so they don't adapt.
  if (typeof body.company === "string" && body.company.trim()) return NextResponse.json(PENDING, { status: 202 });

  const result = await requestSubscription(body, clientIp(req));
  return result.ok ? NextResponse.json(PENDING, { status: 202 }) : error(result.error, result.status);
}
