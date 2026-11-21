import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/newsletter/token";
import { NewsletterError, unsubscribe } from "@/lib/newsletter/resend";

// This URL is both the email's unsubscribe link and its List-Unsubscribe
// header target.
//
// GET (a person clicking the link, or a mail scanner pre-fetching it) only
// shows the confirmation page. POST unsubscribes: either the page's button or
// a mail client's one-click unsubscribe (RFC 8058), which posts the body
// "List-Unsubscribe=One-Click" and expects a bare 200.

export function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  return NextResponse.redirect(new URL(`/unsubscribe?token=${encodeURIComponent(token)}`, req.url), 303);
}

export async function POST(req: NextRequest) {
  const body = await req.text().catch(() => "");
  const oneClick = body.includes("List-Unsubscribe=One-Click");
  const subscriber = verifyToken(req.nextUrl.searchParams.get("token"), "unsubscribe");
  const page = (query: string) => NextResponse.redirect(new URL(`/unsubscribe?${query}`, req.url), 303);

  if (!subscriber) return oneClick ? new NextResponse(null, { status: 400 }) : page("status=invalid");

  try {
    await unsubscribe(subscriber.email);
    return oneClick ? new NextResponse(null, { status: 200 }) : page("status=done");
  } catch (err) {
    console.error(`[unsubscribe] ${err instanceof NewsletterError ? err.message : "unexpected error"}`);
    return oneClick ? new NextResponse(null, { status: 502 }) : page("status=error");
  }
}
