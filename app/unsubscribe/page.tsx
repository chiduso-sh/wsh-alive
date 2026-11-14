import type { Metadata } from "next";
import Link from "next/link";
import NoticeCard, { primaryButton } from "@/components/NoticeCard";
import { verifyToken } from "@/lib/newsletter/token";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

type Props = { searchParams: Promise<{ token?: string; status?: string }> };

export default async function UnsubscribePage({ searchParams }: Props) {
  const { token, status } = await searchParams;

  if (status === "done") {
    return (
      <NoticeCard eyebrow="Weekly wellness letter" title="You're unsubscribed">
        <p>You won&apos;t get any more letters from us. Changed your mind? You can rejoin any time.</p>
        <Link href="/subscribe" className={`${primaryButton} no-underline`}>Subscribe again</Link>
      </NoticeCard>
    );
  }

  if (status === "error") {
    return (
      <NoticeCard eyebrow="Weekly wellness letter" title="Something went wrong">
        <p>We couldn&apos;t unsubscribe you just now. Please try the link again in a few minutes.</p>
      </NoticeCard>
    );
  }

  const subscriber = verifyToken(token, "unsubscribe");
  if (!subscriber || !token) {
    return (
      <NoticeCard eyebrow="Weekly wellness letter" title="Invalid unsubscribe link">
        <p>This link isn&apos;t valid. Use the unsubscribe link at the bottom of any WSH Alive email.</p>
      </NoticeCard>
    );
  }

  return (
    <NoticeCard eyebrow="Weekly wellness letter" title="Unsubscribe?">
      <p>
        Stop sending the weekly letter to <strong className="font-medium">{subscriber.email}</strong>?
      </p>
      <form method="POST" action={`/api/unsubscribe?token=${encodeURIComponent(token)}`}>
        <button type="submit" className={primaryButton}>Unsubscribe</button>
      </form>
    </NoticeCard>
  );
}
