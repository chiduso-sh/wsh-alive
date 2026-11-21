import "server-only";
import { validateSubscriber } from "@/lib/newsletter/validate";
import { NewsletterError, sendConfirmation } from "@/lib/newsletter/resend";
import { rateLimit } from "@/lib/rate-limit";

// Step 1 of double opt-in: email a signed confirmation link. Nobody is added
// to the list until they click it, so a typo or someone else's address never
// ends up subscribed. Shared by the signup form's API and the chat assistant,
// so both enforce the same validation and limits.

export const PENDING_MESSAGE = "Almost there! Check your inbox and click the link to confirm your subscription.";

export type SubscriptionResult = { ok: true; message: string } | { ok: false; error: string; status: number };

export async function requestSubscription(input: { name?: unknown; email?: unknown }, ip: string): Promise<SubscriptionResult> {
  if (!rateLimit(`subscribe:ip:${ip}`, 5, 10 * 60_000)) {
    return { ok: false, error: "Too many attempts. Please try again in a few minutes.", status: 429 };
  }

  const subscriber = validateSubscriber(input);
  if (typeof subscriber === "string") return { ok: false, error: subscriber, status: 400 };

  // Stops this being used to flood one inbox with confirmation emails.
  // Same response as success, so it doesn't reveal anything about the address.
  if (!rateLimit(`subscribe:email:${subscriber.email}`, 3, 60 * 60_000)) return { ok: true, message: PENDING_MESSAGE };

  try {
    await sendConfirmation(subscriber.name, subscriber.email);
    return { ok: true, message: PENDING_MESSAGE };
  } catch (err) {
    // Log the failure reason only: never the subscriber's name or address.
    console.error(`[subscribe] ${err instanceof NewsletterError ? err.message : "unexpected error"}`);
    return { ok: false, error: "We couldn't send the confirmation email. Please try again later.", status: 502 };
  }
}
