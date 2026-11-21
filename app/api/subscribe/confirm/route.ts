import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/newsletter/token";
import { confirmSubscriber, NewsletterError } from "@/lib/newsletter/resend";

// Step 2 of double opt-in, posted by the form on /subscribe/confirm.
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const token = form?.get("token");
  const subscriber = verifyToken(typeof token === "string" ? token : null, "confirm");
  const back = (query: string) => NextResponse.redirect(new URL(`/subscribe/confirm?${query}`, req.url), 303);

  if (!subscriber) return back("status=expired");

  try {
    await confirmSubscriber(subscriber.name ?? "friend", subscriber.email);
    return back("status=done");
  } catch (err) {
    console.error(`[subscribe/confirm] ${err instanceof NewsletterError ? err.message : "unexpected error"}`);
    return back("status=error");
  }
}
