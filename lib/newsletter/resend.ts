import "server-only";
import { createHash } from "crypto";
import { Resend } from "resend";
import { siteUrl } from "@/lib/site";
import { confirmEmail, welcomeEmail } from "./emails";
import { CONFIRM_TTL_MS, createToken } from "./token";

// All newsletter calls to Resend. Errors are thrown as NewsletterError with a
// short code; callers log the code only, never the subscriber's address.

export class NewsletterError extends Error {}

let client: Resend | null = null;

function resend() {
  if (!process.env.RESEND_API_KEY) throw new NewsletterError("RESEND_API_KEY is not set");
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

// Resend's onboarding@resend.dev sender only delivers to the account owner's
// own address. Real subscribers need RESEND_FROM on a verified domain.
function from() {
  return process.env.RESEND_FROM || "WSH Alive <onboarding@resend.dev>";
}

// Same subscriber + same hour = same key, so a double-clicked form or retried
// request doesn't send two confirmation emails.
function idempotencyKey(kind: string, email: string) {
  const hour = Math.floor(Date.now() / 3_600_000);
  return `${kind}-${createHash("sha256").update(`${email}:${hour}`).digest("hex").slice(0, 32)}`;
}

function check<T>(result: { data: T | null; error: { name?: string; message?: string } | null }, step: string): T {
  if (result.error || result.data === null) throw new NewsletterError(`${step} failed: ${result.error?.name ?? "no data"}`);
  return result.data;
}

export async function sendConfirmation(name: string, email: string) {
  const token = createToken("confirm", email, { name, ttlMs: CONFIRM_TTL_MS });
  const { subject, html, text } = confirmEmail(name, `${siteUrl()}/subscribe/confirm?token=${encodeURIComponent(token)}`);
  check(
    await resend().emails.send({ from: from(), to: email, subject, html, text }, { idempotencyKey: idempotencyKey("confirm", email) }),
    "send confirmation",
  );
}

// Adds (or re-subscribes) the contact, then sends the welcome email.
export async function confirmSubscriber(name: string, email: string) {
  const segmentId = process.env.RESEND_SEGMENT_ID;
  const created = await resend().contacts.create({
    email,
    firstName: name,
    unsubscribed: false,
    ...(segmentId ? { segments: [{ id: segmentId }] } : {}),
  });
  if (created.error) {
    // Already a contact (for example someone who unsubscribed and came back): flip them back on.
    check(await resend().contacts.update({ email, firstName: name, unsubscribed: false }), "resubscribe contact");
    if (segmentId) await resend().contacts.segments.add({ email, segmentId });
  }

  const unsubscribeUrl = `${siteUrl()}/api/unsubscribe?token=${encodeURIComponent(createToken("unsubscribe", email))}`;
  const { subject, html, text } = welcomeEmail(name, siteUrl(), unsubscribeUrl);
  check(
    await resend().emails.send(
      {
        from: from(),
        to: email,
        subject,
        html,
        text,
        headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      },
      { idempotencyKey: idempotencyKey("welcome", email) },
    ),
    "send welcome",
  );
}

export async function unsubscribe(email: string) {
  const result = await resend().contacts.update({ email, unsubscribed: true });
  // A missing contact is already unsubscribed as far as the visitor is concerned.
  if (result.error && result.error.name !== "not_found") throw new NewsletterError(`unsubscribe failed: ${result.error.name}`);
}
