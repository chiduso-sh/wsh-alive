import { getPostBySlug, getAllPosts } from "@/lib/posts";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { Metadata } from "next";
import Link from "next/link";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllPosts().map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.meta.title,
    description: post.meta.excerpt,
    openGraph: { title: post.meta.title, description: post.meta.excerpt },
  };
}

const tagStyles: Record<string, string> = {
  workouts: "text-sage bg-sage-pale",
  nutrition: "text-earth bg-cream",
  lifestyle: "text-blue-600 bg-blue-50",
  mindfulness: "text-purple-600 bg-purple-50",
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { meta, content } = post;

  return (
    <article className="max-w-2xl mx-auto px-6 py-12">
      <Link href="/blog" className="text-xs tracking-widest uppercase text-sage-light hover:text-sage no-underline transition-colors mb-8 inline-block">
        ← Back to journal
      </Link>

      <header className="mb-10">
        <span className={`text-xs tracking-widest uppercase font-medium px-3 py-1 rounded-full ${tagStyles[meta.category] || "text-sage bg-sage-pale"}`}>
          {meta.category}
        </span>
        <h1 className="font-serif text-4xl md:text-5xl text-bark leading-tight font-normal mt-4 mb-4">
          {meta.title}
        </h1>
        <p className="text-base text-[#6A5A4A] font-light leading-relaxed mb-4">{meta.excerpt}</p>
        <div className="flex gap-4 text-sm text-sage-light font-light border-t border-mist pt-4">
          <span>{meta.date}</span>
          <span>·</span>
          <span>{meta.readTime}</span>
        </div>
      </header>

      <div className="prose">
        <MDXRemote source={content} />
      </div>
    </article>
  );
}
