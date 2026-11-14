import { NextRequest, NextResponse } from "next/server";
import { validateSubscriber } from "@/lib/newsletter/validate";
import { NewsletterError, sendConfirmation } from "@/lib/newsletter/resend";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Step 1 of double opt-in: email a signed confirmation link. Nobody is added
// to the list until they click it, so a typo or someone else's address never
// ends up subscribed.

const MAX_BODY_BYTES = 2 * 1024;
const PENDING = {
  status: "pending",
  message: "Almost there! Check your inbox and click the link to confirm your subscription.",
};

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`subscribe:ip:${clientIp(req)}`, 5, 10 * 60_000)) {
    return error("Too many attempts. Please try again in a few minutes.", 429);
  }

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

  const subscriber = validateSubscriber(body);
  if (typeof subscriber === "string") return error(subscriber, 400);

  // Stops this endpoint being used to flood one inbox with confirmation emails.
  // Same response as success, so it doesn't reveal anything about the address.
  if (!rateLimit(`subscribe:email:${subscriber.email}`, 3, 60 * 60_000)) {
    return NextResponse.json(PENDING, { status: 202 });
  }

  try {
    await sendConfirmation(subscriber.name, subscriber.email);
    return NextResponse.json(PENDING, { status: 202 });
  } catch (err) {
    // Log the failure reason only: never the subscriber's name or address.
    console.error(`[subscribe] ${err instanceof NewsletterError ? err.message : "unexpected error"}`);
    return error("We couldn't send the confirmation email. Please try again later.", 502);
  }
}
