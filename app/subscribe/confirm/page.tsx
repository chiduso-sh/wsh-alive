import type { Metadata } from "next";
import Link from "next/link";
import NoticeCard, { primaryButton } from "@/components/NoticeCard";
import { verifyToken } from "@/lib/newsletter/token";

export const metadata: Metadata = { title: "Confirm subscription", robots: { index: false } };

type Props = { searchParams: Promise<{ token?: string; status?: string }> };

// The emailed link opens this page instead of confirming directly: mail
// scanners pre-fetch links, and a GET that subscribes people would let them
// confirm on the reader's behalf. Confirming takes a deliberate click (POST).
export default async function ConfirmPage({ searchParams }: Props) {
  const { token, status } = await searchParams;

  if (status === "done") {
    return (
      <NoticeCard eyebrow="Weekly wellness letter" title="You're subscribed 🌿">
        <p>Welcome aboard. A welcome email is on its way, and the first letter lands on Sunday.</p>
        <Link href="/blog" className={`${primaryButton} no-underline`}>Read the journal</Link>
      </NoticeCard>
    );
  }

  if (status === "error") {
    return (
      <NoticeCard eyebrow="Weekly wellness letter" title="Something went wrong">
        <p>We couldn&apos;t confirm your subscription just now. Please try the link from your email again in a few minutes.</p>
      </NoticeCard>
    );
  }

  const subscriber = verifyToken(token, "confirm");
  if (!subscriber || !token) {
    return (
      <NoticeCard eyebrow="Weekly wellness letter" title="This link has expired">
        <p>Confirmation links last 48 hours. Sign up again and we&apos;ll send a fresh one.</p>
        <Link href="/subscribe" className={`${primaryButton} no-underline`}>Sign up again</Link>
      </NoticeCard>
    );
  }

  return (
    <NoticeCard eyebrow="Weekly wellness letter" title="Confirm your subscription">
      <p>
        Subscribe <strong className="font-medium">{subscriber.email}</strong> to one thoughtful email a week?
      </p>
      <form method="POST" action="/api/subscribe/confirm">
        <input type="hidden" name="token" value={token} />
        <button type="submit" className={primaryButton}>Yes, subscribe me</button>
      </form>
    </NoticeCard>
  );
}
