import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <p className="text-xs tracking-widest uppercase text-earth font-medium mb-4">Our philosophy</p>
      <h1 className="font-serif text-5xl text-bark font-normal leading-tight mb-8">
        Wellness is a<br /><em className="text-sage">lifelong practice.</em>
      </h1>
      <div className="space-y-5 text-base text-[#6A5A4A] font-light leading-relaxed">
        <p>WSH Alive was born out of frustration with the noise — the 30-day challenges, the extreme diets, the hustle culture that treats your body like a machine to be optimized rather than a life to be lived.</p>
        <p>We believe fitness is simple. Move your body in ways that feel good. Eat food that nourishes you. Sleep. Rest. Repeat. Over years, not weeks.</p>
        <p>Every article on this blog is written with one question in mind: will this still make sense in ten years? If the answer is yes, we publish it.</p>
      </div>
      <div className="mt-12 pt-8 border-t border-mist">
        <Link href="/blog" className="bg-sage text-white px-8 py-3 rounded-full text-xs tracking-widest uppercase hover:bg-sage-light transition-colors no-underline">
          Read the journal
        </Link>
      </div>
    </div>
  );
}
