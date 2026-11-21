import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with WSH Alive by email.",
};

const CONTACT_EMAIL = "illusionsstudios2020@gmail.com";

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <p className="text-xs tracking-widest uppercase text-earth font-medium mb-4">Contact</p>
      <h1 className="font-serif text-5xl text-bark font-normal leading-tight mb-8">
        Say hello,<br /><em className="text-sage">we read everything.</em>
      </h1>
      <p className="text-base text-[#6A5A4A] font-light leading-relaxed mb-10">
        Questions about an article, an idea for the journal or feedback on the newsletter: send us an email.
      </p>

      <div className="bg-sage-pale rounded-2xl p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="min-w-0">
          <p className="text-xs tracking-widest uppercase text-sage font-medium mb-2">Email</p>
          <p className="font-serif text-base sm:text-xl text-bark break-all">{CONTACT_EMAIL}</p>
        </div>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="shrink-0 self-start md:self-auto bg-earth text-white px-8 py-3 rounded-full text-xs tracking-widest uppercase font-medium hover:bg-earth-light transition-colors no-underline"
        >
          Write to us
        </a>
      </div>

      <p className="mt-10 pt-8 border-t border-mist text-sm text-[#6A5A4A] font-light leading-relaxed">
        Want your newsletter data removed? Email us from the address you subscribed with. The{" "}
        <Link href="/privacy" className="text-sage underline hover:text-earth">privacy page</Link> explains what we keep.
      </p>
    </div>
  );
}
