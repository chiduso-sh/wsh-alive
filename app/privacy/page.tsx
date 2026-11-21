import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What WSH Alive collects, who processes it and how to get it removed.",
};

// Update whenever what the site collects or who processes it changes.
const LAST_UPDATED = "November 21, 2026";

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <p className="text-xs tracking-widest uppercase text-earth font-medium mb-4">Privacy</p>
      <h1 className="font-serif text-5xl text-bark font-normal leading-tight mb-4">
        Your data,<br /><em className="text-sage">kept simple.</em>
      </h1>
      <p className="text-xs text-sage-light mb-10">Last updated {LAST_UPDATED}</p>

      <div className="prose">
        <p>
          WSH Alive has no accounts, no advertising and no analytics, and sets no cookies. This page explains the little we
          do handle: your newsletter signup and anything you type into the assistant.
        </p>

        <h2>Reading the site</h2>
        <p>
          The site is hosted on <strong>Vercel</strong>, which keeps standard request logs (such as your IP address, browser
          and the page requested) to run and secure its service. Our fonts are loaded from <strong>Google Fonts</strong>, so
          your browser also sends Google your IP address and browser details when it fetches them.
        </p>

        <h2>The newsletter</h2>
        <p>
          When you subscribe, we ask for your first name and email address. Our email provider, <strong>Resend</strong>,
          sends you a confirmation link. You are only added to the mailing list after you click it, and your name and address
          are then stored as a contact in Resend so we can send the weekly letter. Resend also keeps a log of the emails it
          sends.
        </p>
        <p>
          Once you&apos;re subscribed, every email we send includes an unsubscribe link that works in one click. To have your contact deleted entirely,
          ask us through the <Link href="/contact">contact page</Link>.
        </p>

        <h2>The assistant</h2>
        <p>
          The chat assistant is powered by <strong>Google&apos;s Gemini API</strong>. What you type, and the assistant&apos;s
          replies, are sent to Google to generate each answer. We use Gemini&apos;s free tier, under which{" "}
          <strong>Google may use your prompts and its responses to improve its products, and human reviewers may read
          them</strong>. Please don&apos;t share health details, contact details or anything else sensitive in the chat.
        </p>
        <p>
          We don&apos;t store your conversation on our servers. It is kept in your browser&apos;s session storage so it survives
          a page change, and it is cleared when you close the tab. If you ask the assistant to subscribe you, it asks for your
          approval first and then follows the same newsletter process described above.
        </p>

        <h2>Preventing abuse</h2>
        <p>
          To stop spam and protect the assistant&apos;s free quota, our server briefly keeps your IP address, and the email
          address you submit to the newsletter, in memory to count attempts. These counters are never written to disk and
          expire within an hour. Our error logs record what failed, never your name, email or messages.
        </p>

        <h2>What we never do</h2>
        <ul>
          <li>Sell or rent your information.</li>
          <li>Add you to the list without your confirmation.</li>
          <li>Track you across other websites.</li>
        </ul>

        <h2>Children</h2>
        <p>WSH Alive is meant for adults. Please don&apos;t subscribe or use the assistant if you are under 16.</p>

        <h2>Changes and questions</h2>
        <p>
          If what we collect changes, we&apos;ll update this page and the date at the top. For questions or to remove your
          data, get in touch through the <Link href="/contact">contact page</Link>.
        </p>
      </div>
    </div>
  );
}
