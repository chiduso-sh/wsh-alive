import Link from "next/link";

// Centered message card used by the newsletter confirm and unsubscribe pages.
export default function NoticeCard({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-sage-pale rounded-2xl p-8 md:p-10 text-center">
        <p className="text-xs tracking-widest uppercase text-sage font-medium mb-3">{eyebrow}</p>
        <h1 className="font-serif text-3xl text-bark font-normal leading-snug mb-4">{title}</h1>
        <div className="text-sm text-bark/80 font-light leading-relaxed flex flex-col items-center gap-4">{children}</div>
        <Link href="/" className="inline-block mt-6 text-xs tracking-widest uppercase text-sage hover:text-earth no-underline transition-colors">
          ← Back to WSH Alive
        </Link>
      </div>
    </div>
  );
}

export const primaryButton =
  "bg-earth text-white px-8 py-3 rounded-full text-xs tracking-widest uppercase font-medium hover:bg-earth-light transition-colors";
